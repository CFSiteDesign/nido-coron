// Server-only booking logic: seat holds, Stripe outcomes and leads, all
// against Lovable Cloud with the service role. Never import this from client
// code; server functions load it with a dynamic import.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { MAX_GUESTS_PER_TRIP } from "@/data/expedition";
import {
  expireCheckoutSession,
  getCheckoutSession,
  isSessionPaid,
  serverEnv,
  type CheckoutSession,
} from "./stripe.server";

export function databaseConfigured() {
  return Boolean(serverEnv("SUPABASE_URL") && serverEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

const bookings = () => supabaseAdmin.from("expedition_bookings");

// Paid bookings and unexpired holds per departure.
export async function seatsTaken(departureIds: string[]) {
  const taken: Record<string, number> = {};
  if (!departureIds.length) return taken;
  const { data, error } = await bookings()
    .select("departure_id, guests, status, hold_expires_at")
    .in("departure_id", departureIds)
    .in("status", ["paid", "pending"]);
  if (error) throw error;
  const now = Date.now();
  for (const row of data) {
    if (row.status === "paid" || Date.parse(row.hold_expires_at) > now) {
      taken[row.departure_id] = (taken[row.departure_id] ?? 0) + row.guests;
    }
  }
  return taken;
}

export async function seatsLeft(departureId: string) {
  const taken = await seatsTaken([departureId]);
  return Math.max(0, MAX_GUESTS_PER_TRIP - (taken[departureId] ?? 0));
}

// Holds the seats atomically (see reserve_expedition_seats). Returns the new
// booking id, or null when the departure can't fit them.
export async function reserveSeats(input: {
  departureId: string;
  direction: string;
  departureDate: string;
  guests: number;
  fullName: string;
  email: string;
  whatsapp: string;
  amountPhp: number;
  holdUntil: string;
}) {
  const { data, error } = await supabaseAdmin.rpc("reserve_expedition_seats", {
    p_departure_id: input.departureId,
    p_direction: input.direction,
    p_departure_date: input.departureDate,
    p_guests: input.guests,
    p_capacity: MAX_GUESTS_PER_TRIP,
    p_full_name: input.fullName,
    p_email: input.email,
    p_whatsapp: input.whatsapp,
    p_amount_php: input.amountPhp,
    p_hold_until: input.holdUntil,
  });
  if (error) throw error;
  return (data as string | null) ?? null;
}

export async function attachSession(bookingId: string, sessionId: string) {
  const { error } = await bookings().update({ stripe_session_id: sessionId }).eq("id", bookingId);
  if (error) throw error;
}

// Gives the seats back straight away (checkout couldn't be created).
export async function releaseHold(bookingId: string) {
  await bookings().update({ status: "cancelled" }).eq("id", bookingId).eq("status", "pending");
}

// Applies a Checkout Session's result to its booking. Safe to run more than
// once: the success page, the webhook and the reconcile pass all call it.
export async function applySessionOutcome(session: CheckoutSession, failed = false) {
  const bookingId = session.client_reference_id ?? session.metadata?.["booking_id"];
  if (!bookingId) return null;

  if (isSessionPaid(session)) {
    // A real payment always wins, even on a hold we had already let go.
    await bookings()
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent,
      })
      .eq("id", bookingId)
      .in("status", ["pending", "expired", "cancelled"]);
  } else if (session.status === "expired" || failed) {
    await bookings().update({ status: "expired" }).eq("id", bookingId).eq("status", "pending");
  }

  const { data } = await bookings()
    .select("id, status, guests, departure_id, departure_date, direction")
    .eq("id", bookingId)
    .maybeSingle();
  return data;
}

export async function markRefunded(paymentIntentId: string) {
  await bookings()
    .update({ status: "refunded" })
    .eq("stripe_payment_intent_id", paymentIntentId)
    .eq("status", "paid");
}

// Settles holds whose time is up, in case a webhook never arrived: paid ones
// are marked paid, still-open sessions are closed in Stripe so they can't be
// paid later, and the rest are expired. Runs before every new reservation.
export async function reconcileStaleHolds(departureId: string) {
  const { data, error } = await bookings()
    .select("id, stripe_session_id")
    .eq("departure_id", departureId)
    .eq("status", "pending")
    .lte("hold_expires_at", new Date().toISOString())
    .limit(25);
  if (error) throw error;

  for (const row of data) {
    if (!row.stripe_session_id) {
      await releaseHold(row.id);
      continue;
    }
    try {
      let session = await getCheckoutSession(row.stripe_session_id);
      if (session.status === "open") session = await expireCheckoutSession(session.id);
      await applySessionOutcome(session);
    } catch (err) {
      // Leave it pending and try again on the next checkout.
      console.error("Couldn't reconcile booking", row.id, err);
    }
  }
}

export async function saveLead(lead: { email: string; whatsapp: string; interest: string }) {
  const { error } = await supabaseAdmin.from("expedition_leads").insert({
    email: lead.email ? lead.email.toLowerCase() : null,
    whatsapp: lead.whatsapp || null,
    interest: lead.interest,
  });
  // 23505: this email is already on the list, which is fine.
  if (error && error.code !== "23505") throw error;
}
