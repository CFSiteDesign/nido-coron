import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  DEPARTURES,
  MAX_GUESTS_PER_BOOKING,
  PRICE_PHP,
  ROUTES,
  formatDate,
  todayInManila,
} from "@/data/expedition";

// Server-only secrets. Set them in the hosting environment, never in the repo:
//   STRIPE_SECRET_KEY   Stripe secret key (sk_live_... / sk_test_...)
//   LEADS_WEBHOOK_URL   where "not ready to book" sign-ups are POSTed as JSON
// On the Cloudflare build Nitro also exposes the worker's bindings as
// globalThis.__env__, so check both.
function serverEnv(name: "STRIPE_SECRET_KEY" | "LEADS_WEBHOOK_URL") {
  type Env = Record<string, string | undefined>;
  const g = globalThis as { process?: { env?: Env }; __env__?: Env };
  const value = g.process?.env?.[name] ?? g.__env__?.[name];
  return value?.trim() || undefined;
}

const CheckoutInput = z.object({
  departureId: z.string().max(40),
  guests: z.number().int().min(1).max(MAX_GUESTS_PER_BOOKING),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(200),
  whatsapp: z.string().trim().max(32),
});

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; reason: "payments_not_live" | "departure_unavailable" | "stripe_error" };

// Creates a Stripe Checkout Session. The price always comes from PRICE_PHP on
// the server, whatever the browser sends.
export const createCheckout = createServerFn({ method: "POST" })
  .validator((input: unknown) => CheckoutInput.parse(input))
  .handler(async ({ data }): Promise<CheckoutResult> => {
    const key = serverEnv("STRIPE_SECRET_KEY");
    if (!key) return { ok: false, reason: "payments_not_live" };

    const departure = DEPARTURES.find((d) => d.id === data.departureId);
    if (!departure || departure.date <= todayInManila())
      return { ok: false, reason: "departure_unavailable" };
    const route = ROUTES[departure.direction];

    const url = getRequestUrl();
    const home = `${url.origin}${import.meta.env.BASE_URL}`;
    const when = formatDate(departure.date, true);

    const meta: Record<string, string> = {
      departure_id: departure.id,
      departure_date: departure.date,
      direction: route.label,
      guests: String(data.guests),
      guest_name: data.name,
      whatsapp: data.whatsapp,
    };

    const body = new URLSearchParams({
      mode: "payment",
      customer_email: data.email,
      allow_promotion_codes: "true",
      success_url: `${home}?booking=success`,
      cancel_url: `${home}?booking=cancelled#departures`,
      "line_items[0][quantity]": String(data.guests),
      "line_items[0][price_data][currency]": "php",
      "line_items[0][price_data][unit_amount]": String(PRICE_PHP * 100),
      "line_items[0][price_data][product_data][name]": `Mad Monkey Palawan Expedition: ${route.label}`,
      "line_items[0][price_data][product_data][description]": `3 days, 2 nights. Departs ${when}, 8AM. Briefing ${route.briefing}.`,
    });
    for (const [k, v] of Object.entries(meta)) {
      body.set(`metadata[${k}]`, v);
      body.set(`payment_intent_data[metadata][${k}]`, v);
    }

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const session = (await res.json().catch(() => null)) as {
      url?: string;
      error?: { message?: string };
    } | null;
    if (!res.ok || !session?.url) {
      console.error("Stripe checkout failed", res.status, session?.error?.message);
      return { ok: false, reason: "stripe_error" };
    }
    return { ok: true, url: session.url };
  });

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
    {
      message: "Add an email or a WhatsApp number",
    },
  );

export type LeadResult = { ok: true } | { ok: false; reason: "leads_not_live" | "send_failed" };

export const captureLead = createServerFn({ method: "POST" })
  .validator((input: unknown) => LeadInput.parse(input))
  .handler(async ({ data }): Promise<LeadResult> => {
    const hook = serverEnv("LEADS_WEBHOOK_URL");
    if (!hook) return { ok: false, reason: "leads_not_live" };
    const res = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "palawan-expedition",
        email: data.email,
        whatsapp: data.whatsapp,
        interest: data.interest,
        created_at: new Date().toISOString(),
      }),
    }).catch(() => null);
    if (!res?.ok) return { ok: false, reason: "send_failed" };
    return { ok: true };
  });
