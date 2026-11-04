// Server-only helpers: hosting secrets and a minimal Stripe REST client. No
// SDK, so it runs unchanged on the Cloudflare Workers build.

type Env = Record<string, string | undefined>;

// Secrets are set in the hosting environment, never in the repo:
//   STRIPE_SECRET_KEY        Stripe secret key (sk_live_... / sk_test_...)
//   STRIPE_WEBHOOK_SECRET    signing secret of the /api/stripe-webhook endpoint
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   provided by Lovable Cloud
// On the Cloudflare build Nitro also exposes the worker's bindings as
// globalThis.__env__, so check both.
export function serverEnv(name: string) {
  const g = globalThis as { process?: { env?: Env }; __env__?: Env };
  const value = g.process?.env?.[name] ?? g.__env__?.[name];
  return value?.trim() || undefined;
}

export type CheckoutSession = {
  id: string;
  url: string | null;
  status: "open" | "complete" | "expired";
  payment_status: "paid" | "unpaid" | "no_payment_required";
  payment_intent: string | null;
  amount_total: number | null;
  livemode: boolean;
  client_reference_id: string | null;
  metadata: Record<string, string> | null;
};

export class StripeError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function stripeRequest<T>(
  method: "GET" | "POST",
  path: string,
  params?: URLSearchParams,
  idempotencyKey?: string,
): Promise<T> {
  const key = serverEnv("STRIPE_SECRET_KEY");
  if (!key) throw new StripeError(0, "STRIPE_SECRET_KEY is not set");

  const headers: Record<string, string> = { Authorization: `Bearer ${key}` };
  if (method === "POST") headers["Content-Type"] = "application/x-www-form-urlencoded";
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const query = method === "GET" && params ? `?${params}` : "";
  const res = await fetch(`https://api.stripe.com/v1/${path}${query}`, {
    method,
    headers,
    ...(method === "POST" && params ? { body: params } : {}),
  });
  const json = (await res.json().catch(() => null)) as
    (T & { error?: { message?: string } }) | null;
  if (!res.ok || !json) {
    throw new StripeError(res.status, json?.error?.message ?? `Stripe ${method} ${path} failed`);
  }
  return json;
}

// True once the guest owes nothing more: paid in full, or a completed checkout
// that a 100% off promo code brought down to zero.
export function isSessionPaid(session: Pick<CheckoutSession, "status" | "payment_status">) {
  return (
    session.payment_status === "paid" ||
    (session.status === "complete" && session.payment_status === "no_payment_required")
  );
}

export function getCheckoutSession(id: string) {
  return stripeRequest<CheckoutSession>("GET", `checkout/sessions/${encodeURIComponent(id)}`);
}

export function expireCheckoutSession(id: string) {
  return stripeRequest<CheckoutSession>(
    "POST",
    `checkout/sessions/${encodeURIComponent(id)}/expire`,
  );
}

// Checks a Stripe-Signature header (t=...,v1=...) against the raw body.
export async function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  toleranceSeconds = 300,
) {
  if (!header) return false;
  let timestamp: string | undefined;
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const i = part.indexOf("=");
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k === "t") timestamp = v;
    if (k === "v1") signatures.push(v);
  }
  if (!timestamp || !signatures.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > toleranceSeconds) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(`${timestamp}.${payload}`));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return signatures.some((s) => constantTimeEqual(s, expected));
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
