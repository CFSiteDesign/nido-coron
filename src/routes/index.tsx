import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BookingProvider } from "@/components/expedition/Booking";
import { Footer, FooterCta } from "@/components/expedition/Closing";
import { Departures } from "@/components/expedition/Departures";
import { Faq } from "@/components/expedition/Faq";
import { Features } from "@/components/expedition/Features";
import { Hero } from "@/components/expedition/Hero";
import { Included } from "@/components/expedition/Included";
import { Itinerary } from "@/components/expedition/Itinerary";
import { MobileBookBar, Nav } from "@/components/expedition/Nav";
import { SocialProof } from "@/components/expedition/SocialProof";
import { Wave } from "@/components/expedition/Wave";
import { AVAILABILITY_KEY } from "@/components/expedition/useAvailability";
import { confirmBooking, type ConfirmResult } from "@/lib/booking.functions";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <BookingProvider>
      <Nav />
      <main>
        <Hero />
        <Features />
        <Itinerary />
        <Wave fill="var(--cream)" className="-mt-px bg-powder" />
        <Included />
        <Departures />
        <SocialProof />
        <Faq />
        <FooterCta />
      </main>
      <Footer />
      <MobileBookBar />
      <BookingReturnNotice />
    </BookingProvider>
  );
}

// Stripe sends people back with ?booking=success&session_id=... Confirm the
// payment with Stripe (that also records it if the webhook is slow), say
// thanks, then tidy the URL so a refresh doesn't repeat it.
function BookingReturnNotice() {
  const confirm = useServerFn(confirmBooking);
  const queryClient = useQueryClient();
  const [result, setResult] = useState<ConfirmResult | "checking" | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const booking = params.get("booking");
    if (!booking) return;
    const sessionId = params.get("session_id");
    params.delete("booking");
    params.delete("session_id");
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`,
    );
    if (booking !== "success") return;
    if (!sessionId) {
      setResult({ status: "unknown" });
      return;
    }
    setResult("checking");
    confirm({ data: { sessionId } })
      .then((r) => {
        setResult(r);
        void queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEY });
      })
      .catch(() => setResult({ status: "unknown" }));
  }, [confirm, queryClient]);

  if (!result) return null;

  // "unknown": we couldn't check with Stripe, so don't claim the payment landed.
  let title = "Thanks for booking!";
  let body =
    "We're confirming your payment and will email you before the 6PM briefing the night before you sail.";
  if (result === "checking") {
    title = "Confirming your booking";
    body = "Hang tight, we're checking your payment with Stripe.";
  } else if (result.status === "paid") {
    title = "You're on the boat!";
    body = `${result.guests} spot${result.guests === 1 ? "" : "s"} on ${result.routeLabel}, ${result.date}. We'll be in touch before the 6PM briefing the night before you sail.`;
  } else if (result.status === "pending") {
    title = "Almost there";
    body = `Your payment for ${result.routeLabel}, ${result.date} is still being confirmed. Your spots are held, and we'll email you as soon as it's through.`;
  }

  return (
    <div
      role="status"
      className="fixed inset-x-3 top-24 z-50 mx-auto max-w-lg rounded-[1.25rem] bg-midnight p-5 text-cream shadow-2xl md:top-28"
    >
      <div className="flex gap-3">
        {result === "checking" ? (
          <Loader2 className="mt-0.5 size-6 shrink-0 animate-spin text-chartreuse" />
        ) : (
          <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-chartreuse" />
        )}
        <div className="flex-1">
          <p className="text-lg font-extrabold">{title}</p>
          <p className="fine mt-1 text-cream/80">{body}</p>
        </div>
        <button
          type="button"
          onClick={() => setResult(null)}
          aria-label="Dismiss"
          className="grid size-8 place-items-center rounded-full hover:bg-cream/10"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
