import { MapPin, Moon, Sunrise, Tent } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { ROUTES, itinerary, type Direction } from "@/data/expedition";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

export function Itinerary() {
  const [direction, setDirection] = useState<Direction>("elnido-coron");
  const [day, setDay] = useState(0);
  const days = useMemo(() => itinerary(direction), [direction]);
  const current = days[day] ?? days[0]!;
  const tabsId = useId();

  const places =
    direction === "elnido-coron"
      ? ["El Nido", "Linapacan", "Culion", "Coron"]
      : ["Coron", "Culion", "Linapacan", "El Nido"];

  return (
    <section
      id="itinerary"
      aria-labelledby="itinerary-title"
      className="relative -mt-0.5 bg-powder px-3 pb-20 pt-6 md:px-6 md:pb-28 md:pt-10"
    >
      <div className="mx-auto max-w-[1320px]">
        <Reveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker">Itinerary</p>
              <h2 id="itinerary-title" className="display mt-2 text-[clamp(2.9rem,7vw,6.4rem)]">
                Three days, two nights
              </h2>
            </div>
            <div
              role="radiogroup"
              aria-label="Direction"
              className="inline-flex self-start rounded-full bg-cream/70 p-1 md:self-auto"
            >
              {(Object.keys(ROUTES) as Direction[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={direction === d}
                  onClick={() => {
                    setDirection(d);
                    setDay(0);
                  }}
                  className={cn(
                    "rounded-full px-4 py-2.5 text-sm font-bold transition-colors md:px-5",
                    direction === d ? "bg-midnight text-cream" : "hover:bg-cream",
                  )}
                >
                  {ROUTES[d].label}
                </button>
              ))}
            </div>
          </div>

          {/* Route line: start, two camps, finish */}
          <ol className="mt-10 grid grid-cols-4" aria-label="Route">
            {places.map((p, i) => (
              <li key={p} className="relative flex flex-col items-center text-center">
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-[1.05rem] h-[2px] bg-midnight/70",
                    i === 0
                      ? "left-1/2 right-0"
                      : i === places.length - 1
                        ? "left-0 right-1/2"
                        : "inset-x-0",
                  )}
                />
                <span
                  className={cn(
                    "relative grid size-[2.15rem] place-items-center rounded-full border-2 border-midnight",
                    i === 0 || i === places.length - 1 ? "bg-chartreuse" : "bg-cream",
                  )}
                >
                  {i === 0 || i === places.length - 1 ? (
                    <MapPin className="size-4" />
                  ) : (
                    <Tent className="size-4" />
                  )}
                </span>
                <span className="mt-2 text-sm font-bold md:text-base">{p}</span>
                <span className="fine text-midnight/70">
                  {i === 0 ? "Start" : i === places.length - 1 ? "Finish" : `Night ${i}`}
                </span>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal className="mt-10 md:mt-14">
          <div role="tablist" aria-label="Days" className="flex gap-2">
            {days.map((d, i) => (
              <button
                key={d.day}
                type="button"
                role="tab"
                id={`${tabsId}-tab-${i}`}
                aria-selected={day === i}
                aria-controls={`${tabsId}-panel`}
                onClick={() => setDay(i)}
                className={cn(
                  "flex-1 rounded-full px-4 py-3 text-sm font-bold transition-colors md:flex-none md:px-7",
                  day === i ? "bg-midnight text-cream" : "bg-cream/70 hover:bg-cream",
                )}
              >
                Day {d.day}
              </button>
            ))}
          </div>

          <div
            id={`${tabsId}-panel`}
            role="tabpanel"
            aria-labelledby={`${tabsId}-tab-${day}`}
            className="mt-4 grid grid-cols-12 overflow-hidden rounded-[1.25rem] bg-cream md:rounded-[1.5rem]"
          >
            <div className="col-span-12 aspect-[16/10] md:col-span-6 md:aspect-auto md:min-h-[440px]">
              <img
                key={current.image}
                src={asset(current.image)}
                alt={current.alt}
                loading="lazy"
                className="h-full w-full object-cover animate-in fade-in-0 duration-500"
              />
            </div>
            <div className="col-span-12 flex flex-col p-5 md:col-span-6 md:p-10">
              <p className="kicker text-lapis">Day 0{current.day}</p>
              <h3 className="display mt-2 text-[clamp(2.4rem,4.4vw,3.8rem)]">
                {current.from} <span className="text-lapis">→</span> {current.to}
              </h3>
              {current.start && (
                <p className="mt-4 flex gap-2.5 text-[0.95rem] leading-relaxed">
                  <Sunrise className="mt-0.5 size-5 shrink-0 text-lapis" /> {current.start}
                </p>
              )}
              <p className="mt-3 leading-relaxed text-midnight/80">{current.blurb}</p>
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Example stops">
                {current.stops.map((s) => (
                  <li key={s} className="tag bg-powder-soft">
                    {s}
                  </li>
                ))}
              </ul>
              <p className="mt-auto flex gap-2.5 border-t border-border pt-5 text-[0.95rem] leading-relaxed md:mt-8">
                <Moon className="mt-0.5 size-5 shrink-0 text-lapis" /> {current.end}
              </p>
            </div>
          </div>
          <p className="fine mt-4 max-w-2xl text-midnight/75">
            Example itinerary. The sea decides: there's no fixed route because of open-water
            crossings, so the captain picks the safest and best stops on the day.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
