// Stripe webhook: keeps expedition_bookings in step with payments. Point a
// Stripe webhook endpoint at /api/stripe-webhook with these events:
//   checkout.session.completed, checkout.session.expired,
//   checkout.session.async_payment_succeeded, checkout.session.async_payment_failed,
//   charge.refunded
// and put its signing secret in STRIPE_WEBHOOK_SECRET.
import { applySessionOutcome, databaseConfigured, markRefunded } from "./expedition.server";
import { serverEnv, verifyStripeSignature, type CheckoutSession } from "./stripe.server";

type StripeEvent = { id: string; type: string; data: { object: Record<string, unknown> } };

export async function handleStripeWebhook(request: Request) {
  const secret = serverEnv("STRIPE_WEBHOOK_SECRET");
  if (!secret || !databaseConfigured()) {
    return Response.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const payload = await request.text();
  const valid = await verifyStripeSignature(
    payload,
    request.headers.get("stripe-signature"),
    secret,
  );
  if (!valid) return Response.json({ error: "Bad signature" }, { status: 400 });

  const event = JSON.parse(payload) as StripeEvent;
  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
      case "checkout.session.expired":
        await applySessionOutcome(event.data.object as unknown as CheckoutSession);
        break;
      case "checkout.session.async_payment_failed":
        await applySessionOutcome(event.data.object as unknown as CheckoutSession, true);
        break;
      case "charge.refunded": {
        const charge = event.data.object as { refunded?: boolean; payment_intent?: string | null };
        // Only a full refund gives the seats back.
        if (charge.refunded && charge.payment_intent) await markRefunded(charge.payment_intent);
        break;
      }
    }
  } catch (err) {
    // A 500 makes Stripe retry later.
    console.error("Stripe webhook failed", event.type, event.id, err);
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }
  return Response.json({ received: true });
}
