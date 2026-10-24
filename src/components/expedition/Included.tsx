import { ArrowRight, Check, Ship, ShieldCheck, Tent, Utensils, Waves, X } from "lucide-react";
import {
  INCLUDED,
  MAX_GUESTS_PER_TRIP,
  NOT_INCLUDED,
  PRICE_PHP,
  formatPeso,
} from "@/data/expedition";
import { asset } from "@/lib/asset";
import { useBooking } from "./Booking";
import { Reveal } from "./Reveal";

const ICONS = {
  ship: Ship,
  tent: Tent,
  utensils: Utensils,
  waves: Waves,
  shield: ShieldCheck,
} as const;

const BOAT_FACTS = [
  `Registered for 26, capped at ${MAX_GUESTS_PER_TRIP} guests`,
  "Captain and 6 crew, including guide and chef",
  "2 Mad Monkey hosts onboard",
  "Upper sundeck and shaded seating",
  "Toilet, kitchen and dining table",
  "Solar power and a speaker",
  "Snorkels, kayak and towels",
];

export function Included() {
  const book = useBooking();

  return (
    <section id="included" aria-labelledby="included-title" className="px-3 py-20 md:px-6 md:py-32">
      <div className="mx-auto max-w-[1320px]">
        <Reveal>
          <div className="grid grid-cols-12 gap-y-8 md:gap-x-10">
            <div className="col-span-12 md:col-span-8">
              <p className="kicker text-lapis">What's included</p>
              <h2 id="included-title" className="display mt-2 text-[clamp(2.9rem,7vw,6.4rem)]">
                One price. Three days. Everything on the boat.
              </h2>
            </div>
            <div className="col-span-12 self-end rounded-[1.25rem] bg-midnight p-6 text-cream md:col-span-4 md:p-7">
              <p className="kicker text-cream/70">Per person, all in</p>
              <p className="display mt-2 text-[4.4rem] text-chartreuse md:text-[5.2rem]">
                {formatPeso(PRICE_PHP)}
              </p>
              <p className="fine mt-1 text-cream/75">
                Boat, beds, food, rum, gear and hosts. No surprise add-ons on the water.
              </p>
              <button type="button" onClick={() => book()} className="btn-cta mt-5 w-full">
                Book your spot <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </Reveal>

        <ul className="mt-12 grid gap-3 md:mt-16 md:grid-cols-3 md:gap-4">
          {INCLUDED.map((group, i) => {
            const Icon = ICONS[group.icon];
            return (
              <Reveal
                as="li"
                key={group.title}
                delay={i * 60}
                className="rounded-[1.25rem] bg-sand p-6 md:p-7"
              >
                <span className="grid size-11 place-items-center rounded-full bg-powder">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-xl font-extrabold tracking-tight">{group.title}</h3>
                <ul className="mt-3 space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[0.95rem] leading-snug">
                      <Check className="mt-0.5 size-4 shrink-0 text-lapis" strokeWidth={3} />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            );
          })}
          <Reveal
            as="li"
            delay={INCLUDED.length * 60}
            className="rounded-[1.25rem] border-2 border-dashed border-midnight/25 p-6 md:p-7"
          >
            <span className="grid size-11 place-items-center rounded-full bg-cream shadow-[inset_0_0_0_1.5px_var(--midnight)]">
              <X className="size-5" />
            </span>
            <h3 className="mt-4 text-xl font-extrabold tracking-tight">Not included</h3>
            <ul className="mt-3 space-y-2">
              {NOT_INCLUDED.map((item) => (
                <li
                  key={item}
                  className="flex gap-2.5 text-[0.95rem] leading-snug text-midnight/80"
                >
                  <span aria-hidden className="mt-[0.55rem] h-[2px] w-3 shrink-0 bg-midnight/50" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </ul>

        <Reveal className="mt-16 md:mt-24">
          <div className="overflow-hidden rounded-[1.5rem] bg-midnight text-cream">
            <div className="grid grid-cols-12">
              <div className="col-span-12 p-6 md:col-span-5 md:p-10">
                <p className="kicker text-chartreuse">Your ride</p>
                <h3 className="display mt-2 text-[clamp(2.6rem,5vw,4.4rem)]">Meet John Dave</h3>
                <p className="mt-4 max-w-md leading-relaxed text-cream/80">
                  A traditional Filipino outrigger run by our partners at MeetMe Tours, El Nido
                  island-hopping specialists. Big enough for 26, so with 20 aboard there's room to
                  sprawl on the sundeck between islands.
                </p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {BOAT_FACTS.map((f) => (
                    <li key={f} className="tag bg-cream/10 text-cream">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-span-12 md:col-span-7">
                <img
                  src={asset("media/boat-john-dave.webp")}
                  alt="The expedition boat John Dave, a blue and white outrigger with yellow sun sails, anchored in clear water"
                  loading="lazy"
                  className="h-full min-h-[220px] w-full object-cover object-[55%_50%]"
                />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
