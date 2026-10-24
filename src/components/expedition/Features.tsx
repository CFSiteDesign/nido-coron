import type { ReactNode } from "react";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";
import { LoopVideo } from "./LoopVideo";
import { Reveal } from "./Reveal";

type Feature = {
  n: string;
  title: string;
  lead: string;
  body: string;
  media: ReactNode;
  flip?: boolean;
};

const FEATURES: Feature[] = [
  {
    n: "01",
    title: "Island hopping",
    lead: "Hidden beaches, sandbars, reefs.",
    body: "Three to five stops a day along the El Nido to Coron corridor, well away from the tour-boat traffic. Swim off the side, snorkel the reefs, jump off things you probably shouldn't.",
    media: (
      <img
        src={asset("media/feature-island.webp")}
        srcSet={`${asset("media/feature-island-640.webp")} 640w, ${asset("media/feature-island.webp")} 1086w`}
        sizes="(min-width: 768px) 50vw, 100vw"
        alt="Travellers on a traditional bangka anchored in turquoise water off a small island"
        loading="lazy"
        className="h-full w-full object-cover object-[50%_55%]"
      />
    ),
  },
  {
    n: "02",
    title: "Castaway camping",
    lead: "Nights on remote beaches.",
    body: "Two nights in simple native huts right on the sand. Sunset from the beach, Filipino BBQ cooked by the crew, then karaoke, a bonfire and free rum until someone suggests a night swim.",
    flip: true,
    media: (
      <img
        src={asset("media/feature-camp.webp")}
        srcSet={`${asset("media/feature-camp-720.webp")} 720w, ${asset("media/feature-camp.webp")} 1200w`}
        sizes="(min-width: 768px) 50vw, 100vw"
        alt="Two people walking along a Palawan beach under a blazing orange sunset"
        loading="lazy"
        className="h-full w-full object-cover object-[50%_68%]"
      />
    ),
  },
  {
    n: "03",
    title: "Built for solo travellers",
    lead: "Mad Monkey crew, games, new mates.",
    body: "Two Mad Monkey hosts on every trip, games on deck and music at camp. Most people come alone. Everyone leaves with a group chat.",
    media: (
      <LoopVideo
        src="media/solo-dj.mp4"
        poster="media/solo-dj.webp"
        label="A DJ playing a set on the beach at sunset"
      />
    ),
  },
];

export function Features() {
  return (
    <section
      id="trip"
      aria-labelledby="trip-title"
      className="relative overflow-hidden px-3 pb-10 pt-20 md:px-6 md:pb-16 md:pt-32"
    >
      {/* The TIDE sweep: powder blue rolls in from the right and floods the bottom. */}
      <svg
        aria-hidden
        viewBox="0 0 1440 1000"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[74%] w-full md:h-[68%]"
      >
        <path
          d="M1440 0 C 1270 30 1120 120 1010 260 C 880 420 760 560 520 640 C 330 700 150 690 0 650 V1000 H1440 Z"
          fill="var(--powder)"
        />
      </svg>

      <div className="relative mx-auto max-w-[1320px]">
        <h2 id="trip-title" className="sr-only">
          The trip
        </h2>
        <div className="space-y-16 md:space-y-28">
          {FEATURES.map((f) => (
            <Reveal key={f.n}>
              <article className="grid grid-cols-12 items-center gap-y-6 md:gap-x-10">
                <div
                  className={cn(
                    "col-span-12 aspect-[5/4] overflow-hidden rounded-[1.1rem] md:col-span-6 md:aspect-[16/11] md:rounded-[1.25rem]",
                    f.flip && "md:order-2 md:col-start-7",
                  )}
                >
                  {f.media}
                </div>
                <div
                  className={cn(
                    "col-span-12 md:col-span-5",
                    f.flip ? "md:order-1 md:col-start-2 md:pr-6" : "md:col-start-8",
                  )}
                >
                  <p className="kicker text-lapis">{f.n} / 03</p>
                  <h3 className="display mt-3 text-[clamp(2.6rem,5.2vw,4.6rem)]">{f.title}</h3>
                  <p className="mt-4 text-lg font-semibold">{f.lead}</p>
                  <p className="mt-2 max-w-[30rem] leading-relaxed text-midnight/80">{f.body}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
