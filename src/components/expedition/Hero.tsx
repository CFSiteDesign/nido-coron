import { ArrowRight } from "lucide-react";
import { PRICE_PHP, formatPeso } from "@/data/expedition";
import { asset } from "@/lib/asset";
import { useBooking } from "./Booking";
import { LoopVideo } from "./LoopVideo";

const FACTS = [
  ["3 days, 2 nights", "by boat"],
  ["El Nido ⇄ Coron", "both directions"],
  ["Max 20 guests", "plus 2 Mad Monkey hosts"],
  [`${formatPeso(PRICE_PHP)}`, "per person, all in"],
];

export function Hero() {
  const book = useBooking();

  return (
    <section id="top" className="px-3 pt-[5.75rem] md:px-6 md:pt-[7.25rem]">
      <div className="mx-auto max-w-[1320px]">
        <div className="grid grid-cols-12 gap-2.5 md:gap-4">
          <figure className="relative col-span-12 h-[31svh] min-h-[230px] overflow-hidden rounded-[1.1rem] md:col-span-7 md:h-[min(60vh,600px)] md:rounded-[1.25rem]">
            <img
              src={asset("media/hero-group.webp")}
              srcSet={`${asset("media/hero-group-800.webp")} 800w, ${asset("media/hero-group.webp")} 1400w`}
              sizes="(min-width: 768px) 58vw, 100vw"
              alt="A crew of travellers laughing together on the deck of a boat"
              className="h-full w-full object-cover object-[50%_35%]"
              fetchPriority="high"
            />
          </figure>

          <figure className="relative col-span-12 h-[22svh] min-h-[170px] overflow-hidden rounded-[1.1rem] md:col-span-5 md:h-[min(46vh,450px)] md:rounded-[1.25rem]">
            <LoopVideo
              src="media/hero-boat.mp4"
              poster="media/hero-boat.webp"
              label="View from the bow of a boat cruising towards a palm-lined island"
              className="object-[50%_45%]"
            />
            <div className="absolute inset-0 grid place-items-center">
              <button type="button" onClick={() => book()} className="btn-cta shadow-xl">
                Book your spot <ArrowRight className="size-4" />
              </button>
            </div>
          </figure>
        </div>

        <div className="relative z-10 mt-5 md:-mt-[calc(min(6.5vw,5.85rem)*0.34)]">
          <h1 className="display text-[clamp(3rem,14vw,5rem)] text-midnight md:text-[min(6.5vw,5.85rem)]">
            <span className="relative block md:whitespace-nowrap">
              {/* Same line again, stroked white and clipped to the photo, so only
                  the letters sitting on the photo get an outline. */}
              <span aria-hidden className="hero-photo-outline">
                More than island hopping
              </span>
              <span className="relative">More than island hopping</span>
              <span
                aria-hidden
                className="relative ml-[0.18em] inline-block h-[0.085em] w-[0.42em] translate-y-[-0.3em] bg-midnight align-middle"
              />
            </span>
            <span className="mt-[0.06em] block md:text-right">Three days lost in Palawan</span>
          </h1>
          <p className="mt-4 max-w-[22rem] text-[0.95rem] leading-relaxed text-ink-soft md:absolute md:bottom-[0.4vw] md:left-0 md:mt-0 md:max-w-[23%] md:text-[0.95rem]">
            Remote islands, beach camps, and a crew that feels like family.
          </p>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[1.1rem] bg-border md:mt-12 md:grid-cols-4">
          {FACTS.map(([big, small]) => (
            <div key={big} className="bg-cream px-4 py-4 md:px-6 md:py-5">
              <dt className="text-[1.05rem] font-extrabold leading-tight md:text-xl">{big}</dt>
              <dd className="fine text-ink-soft">{small}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
