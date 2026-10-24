import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { PRICE_PHP, formatPeso } from "@/data/expedition";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";
import { useBooking } from "./Booking";

const LINKS = [
  { href: "#trip", label: "The trip" },
  { href: "#itinerary", label: "Itinerary" },
  { href: "#included", label: "What's included" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  const book = useBooking();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 md:px-6 md:pt-4">
      <nav
        aria-label="Main"
        className="relative mx-auto flex h-16 max-w-[1320px] items-center justify-between rounded-[1.25rem] bg-powder/95 pl-2 pr-2 shadow-[0_8px_30px_-12px_color-mix(in_oklch,var(--midnight)_35%,transparent)] backdrop-blur md:h-[4.5rem] md:pl-3 md:pr-3"
      >
        <a
          href="#top"
          className="flex items-center gap-2.5"
          aria-label="Mad Monkey Palawan Expedition, back to top"
        >
          <Badge className="-mb-6 size-[4.6rem] drop-shadow-[0_6px_10px_rgba(19,36,65,0.25)] md:-mb-8 md:size-[5.6rem]" />
          <span className="hidden leading-tight sm:block">
            <span className="block text-[0.95rem] font-extrabold tracking-tight">
              Palawan Expedition
            </span>
            <span className="fine block text-midnight/70">El Nido ⇄ Coron</span>
          </span>
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-full px-3.5 py-2 text-[0.9rem] font-semibold transition-colors hover:bg-cream/60"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => book()}
            className="btn-cta min-h-11 px-4 py-2.5 text-[0.9rem] md:px-5"
          >
            Book now
          </button>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full bg-cream/70 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        <div
          id="mobile-menu"
          className={cn(
            "absolute inset-x-0 top-[calc(100%+0.5rem)] origin-top rounded-[1.25rem] bg-cream p-2 shadow-xl transition-all lg:hidden",
            open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0",
          )}
        >
          <ul>
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="display block rounded-xl px-4 py-3 text-[2rem] hover:bg-sand"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}

// Phone-only bar that keeps the price and the button in reach once the hero
// has scrolled away. Most traffic arrives from Instagram and TikTok.
export function MobileBookBar() {
  const book = useBooking();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const nearEnd = window.innerHeight + window.scrollY > document.body.scrollHeight - 900;
      setShow(window.scrollY > 640 && !nearEnd);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-3 bottom-3 z-30 flex items-center justify-between gap-3 rounded-full bg-midnight py-2 pl-5 pr-2 text-cream shadow-2xl transition-all duration-300 md:hidden",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-24 opacity-0",
      )}
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <span className="leading-tight">
        <span className="block text-base font-extrabold">{formatPeso(PRICE_PHP)}</span>
        <span className="block text-[0.72rem] text-cream/70">3 days, 2 nights, all in</span>
      </span>
      <button type="button" onClick={() => book()} className="btn-cta min-h-11 px-5 py-2.5 text-sm">
        Book your spot
      </button>
    </div>
  );
}
