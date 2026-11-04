import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  DEPARTURES,
  MAX_GUESTS_PER_BOOKING,
  MAX_GUESTS_PER_TRIP,
  PRICE_PHP,
  ROUTES,
  formatDate,
  todayInManila,
  upcomingDepartures,
} from "@/data/expedition";

// Server-only modules are loaded inside the handlers: this file also ships to
// the browser (as RPC stubs), so it must not import them at the top level.
const server = () => Promise.all([import("./expedition.server"), import("./stripe.server")]);

// Stripe's minimum session lifetime is 30 minutes. The seat hold outlives the
// session by 10 minutes so a last-second payment is always still holding its
// seats when it lands.
const SESSION_MINUTES = 31;
const HOLD_GRACE_MINUTES = 10;

const CheckoutInput = z.object({
  departureId: z.string().max(40),
  guests: z.number().int().min(1).max(MAX_GUESTS_PER_BOOKING),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(200),
  whatsapp: z.string().trim().max(32),
});

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; reason: "sold_out"; seatsLeft: number }
  | { ok: false; reason: "payments_not_live" | "departure_unavailable" | "server_error" };

// Holds the seats, then opens a Stripe Checkout Session for them. The price
// always comes from PRICE_PHP on the server, whatever the browser sends.
export const createCheckout = createServerFn({ method: "POST" })
  .validator((input: unknown) => CheckoutInput.parse(input))
  .handler(async ({ data }): Promise<CheckoutResult> => {
    const [db, stripe] = await server();
    if (!stripe.serverEnv("STRIPE_SECRET_KEY") || !db.databaseConfigured()) {
      return { ok: false, reason: "payments_not_live" };
    }

    const departure = DEPARTURES.find((d) => d.id === data.departureId);
    if (!departure || departure.date <= todayInManila()) {
      return { ok: false, reason: "departure_unavailable" };
    }
    const route = ROUTES[departure.direction];

    let bookingId: string | null;
    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60;
    try {
      await db.reconcileStaleHolds(departure.id);
      bookingId = await db.reserveSeats({
        departureId: departure.id,
        direction: departure.direction,
        departureDate: departure.date,
        guests: data.guests,
        fullName: data.name,
        email: data.email.toLowerCase(),
        whatsapp: data.whatsapp,
        amountPhp: PRICE_PHP * data.guests,
        holdUntil: new Date((expiresAt + HOLD_GRACE_MINUTES * 60) * 1000).toISOString(),
      });
      if (!bookingId) {
        return { ok: false, reason: "sold_out", seatsLeft: await db.seatsLeft(departure.id) };
      }
    } catch (err) {
      console.error("Seat reservation failed", err);
      return { ok: false, reason: "server_error" };
    }

    const home = `${getRequestUrl().origin}${import.meta.env.BASE_URL}`;
    const meta: Record<string, string> = {
      booking_id: bookingId,
      departure_id: departure.id,
      departure_date: departure.date,
      direction: route.label,
      guests: String(data.guests),
      guest_name: data.name,
      whatsapp: data.whatsapp,
    };
    const body = new URLSearchParams({
      mode: "payment",
      client_reference_id: bookingId,
      customer_email: data.email,
      expires_at: String(expiresAt),
      allow_promotion_codes: "true",
      "payment_method_types[0]": "card",
      success_url: `${home}?booking=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${home}?booking=cancelled#departures`,
      "line_items[0][quantity]": String(data.guests),
      "line_items[0][price_data][currency]": "php",
      "line_items[0][price_data][unit_amount]": String(PRICE_PHP * 100),
      "line_items[0][price_data][product_data][name]": `Mad Monkey Palawan Expedition: ${route.label}`,
      "line_items[0][price_data][product_data][description]": `3 days, 2 nights. Departs ${formatDate(departure.date, true)}, 8AM. Briefing ${route.briefing}.`,
    });
    for (const [k, v] of Object.entries(meta)) {
      body.set(`metadata[${k}]`, v);
      body.set(`payment_intent_data[metadata][${k}]`, v);
    }

    try {
      const session = await stripe.stripeRequest<{ id: string; url: string | null }>(
        "POST",
        "checkout/sessions",
        body,
        `expedition-checkout-${bookingId}`,
      );
      if (!session.url) throw new Error("Checkout session has no URL");
      await db.attachSession(bookingId, session.id);
      return { ok: true, url: session.url };
    } catch (err) {
      console.error("Stripe checkout failed", err);
      await db.releaseHold(bookingId).catch(() => {});
      return { ok: false, reason: "server_error" };
    }
  });

export type ConfirmResult =
  | { status: "paid" | "pending"; guests: number; routeLabel: string; date: string }
  | { status: "unknown" };

// Called when Stripe sends the guest back. Confirms the payment straight from
// Stripe, so the booking is recorded even if the webhook is slow or missing.
export const confirmBooking = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ sessionId: z.string().regex(/^cs_(test|live)_[A-Za-z0-9]+$/) }).parse(input),
  )
  .handler(async ({ data }): Promise<ConfirmResult> => {
    const [db, stripe] = await server();
    if (!stripe.serverEnv("STRIPE_SECRET_KEY") || !db.databaseConfigured()) {
      return { status: "unknown" };
    }
    try {
      const session = await stripe.getCheckoutSession(data.sessionId);
      const booking = await db.applySessionOutcome(session);
      // A failed email mustn't cost the guest their confirmation; the webhook retries it.
      await db
        .sendBookingEmails(session)
        .catch((err) => console.error("Couldn't send booking emails", err));
      if (!booking) return { status: "unknown" };
      const direction = booking.direction === "coron-elnido" ? "coron-elnido" : "elnido-coron";
      return {
        status: booking.status === "paid" ? "paid" : "pending",
        guests: booking.guests,
        routeLabel: ROUTES[direction].label,
        date: formatDate(booking.departure_date, true),
      };
    } catch (err) {
      console.error("Couldn't confirm booking", err);
      return { status: "unknown" };
    }
  });

export type Availability = Record<string, number> | null;

// Seats left on every upcoming departure, or null when bookings aren't live
// (the page then simply doesn't show counts).
export const getAvailability = createServerFn({ method: "GET" }).handler(
  async (): Promise<Availability> => {
    const [db] = await server();
    if (!db.databaseConfigured()) return null;
    try {
      const ids = upcomingDepartures().map((d) => d.id);
      const taken = await db.seatsTaken(ids);
      return Object.fromEntries(
        ids.map((id) => [id, Math.max(0, MAX_GUESTS_PER_TRIP - (taken[id] ?? 0))]),
      );
    } catch (err) {
      console.error("Couldn't load availability", err);
      return null;
    }
  },
);

const LeadInput = z
  .object({
    email: z.string().trim().max(200),
    whatsapp: z.string().trim().max(32),
    interest: z.enum(["elnido-coron", "coron-elnido", "either"]),
    company: z.string().max(0), // honeypot: real people leave it empty
  })
  .refine(
    (v) =>
      z.string().email().safeParse(v.email).success || v.whatsapp.replace(/\D/g, "").length >= 7,
    { message: "Add an email or a WhatsApp number" },
  );

export type LeadResult = { ok: true } | { ok: false; reason: "leads_not_live" | "send_failed" };

export const captureLead = createServerFn({ method: "POST" })
  .validator((input: unknown) => LeadInput.parse(input))
  .handler(async ({ data }): Promise<LeadResult> => {
    const [db] = await server();
    if (!db.databaseConfigured()) return { ok: false, reason: "leads_not_live" };
    const validEmail = z.string().email().safeParse(data.email).success;
    try {
      await db.saveLead({
        email: validEmail ? data.email : "",
        whatsapp: data.whatsapp,
        interest: data.interest,
      });
      return { ok: true };
    } catch (err) {
      console.error("Couldn't save lead", err);
      return { ok: false, reason: "send_failed" };
    }
  });
