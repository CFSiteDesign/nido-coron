import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, X } from "lucide-react";
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

// Stripe sends people back with ?booking=success (or cancelled). Say thanks,
// then tidy the URL so a refresh doesn't repeat it.
function BookingReturnNotice() {
  const [state, setState] = useState<"success" | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const booking = params.get("booking");
    if (!booking) return;
    if (booking === "success") setState("success");
    params.delete("booking");
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`,
    );
  }, []);

  if (state !== "success") return null;
  return (
    <div
      role="status"
      className="fixed inset-x-3 top-24 z-50 mx-auto max-w-lg rounded-[1.25rem] bg-midnight p-5 text-cream shadow-2xl md:top-28"
    >
      <div className="flex gap-3">
        <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-chartreuse" />
        <div className="flex-1">
          <p className="text-lg font-extrabold">You're on the boat!</p>
          <p className="fine mt-1 text-cream/80">
            Your receipt is on its way to your inbox. We'll be in touch before the 6PM briefing the
            night before you sail.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setState(null)}
          aria-label="Dismiss"
          className="grid size-8 place-items-center rounded-full hover:bg-cream/10"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
