import { ArrowUpRight, Instagram } from "lucide-react";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/data/expedition";
import { LoopVideo } from "./LoopVideo";
import { Reveal } from "./Reveal";

const REELS = [
  {
    src: "media/ugc-snorkel.mp4",
    poster: "media/ugc-snorkel.webp",
    label: "A snorkeller diving down over white sand in clear turquoise water",
    caption: "Reef stop, day two energy",
  },
  {
    src: "media/ugc-lagoon.mp4",
    poster: "media/ugc-lagoon.webp",
    label:
      "A traveller wading through a calm lagoon below limestone rocks with a small white dog swimming beside her",
    caption: "Made a friend at the lagoon",
  },
  {
    src: "media/ugc-float.mp4",
    poster: "media/ugc-float.webp",
    label: "A traveller laughing as a wave crashes over his inflatable",
    caption: "Nacpan, before the briefing",
  },
];

export function SocialProof() {
  return (
    <section aria-labelledby="proof-title" className="px-3 pb-20 pt-12 md:px-6 md:pb-28 md:pt-16">
      <div className="mx-auto max-w-[1320px]">
        <Reveal>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker text-lapis">Straight from the camera roll</p>
              <h2 id="proof-title" className="display mt-2 text-[clamp(2.9rem,7vw,6.4rem)]">
                Palawan, unfiltered
              </h2>
            </div>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 self-start rounded-full bg-sand px-4 py-2.5 text-sm font-bold transition-colors hover:bg-powder-soft md:self-auto"
            >
              <Instagram className="size-4" /> Tag {INSTAGRAM_HANDLE} to get featured
            </a>
          </div>
        </Reveal>

        <div className="-mx-3 mt-10 flex snap-x snap-mandatory scroll-px-3 gap-3 overflow-x-auto px-3 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0">
          {REELS.map((r, i) => (
            <Reveal
              key={r.src}
              delay={i * 70}
              className="w-[68vw] max-w-[300px] shrink-0 snap-start md:w-auto md:max-w-none"
            >
              <figure className="relative aspect-[9/16] overflow-hidden rounded-[1.25rem] bg-sand">
                <LoopVideo src={r.src} poster={r.poster} label={r.label} />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-midnight/75 to-transparent px-4 pb-4 pt-12 text-sm font-semibold text-cream">
                  {r.caption}
                </figcaption>
              </figure>
            </Reveal>
          ))}
          <Reveal
            delay={210}
            className="w-[68vw] max-w-[300px] shrink-0 snap-start md:w-auto md:max-w-none"
          >
            <div className="flex aspect-[9/16] flex-col justify-between rounded-[1.25rem] bg-midnight p-6 text-cream">
              <p className="kicker text-chartreuse">Same crew, now with a boat</p>
              <div>
                <p className="display text-[2.7rem] md:text-[clamp(2.4rem,3.3vw,3.2rem)]">
                  The Mad Monkey vibe, offshore
                </p>
                <p className="mt-4 text-[0.95rem] leading-relaxed text-cream/80">
                  The people behind Mad Monkey's hostels across Southeast Asia, out on the water.
                  Games on deck, rum at camp, and a crew you'll still be texting next year.
                </p>
              </div>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-chartreuse underline-offset-4 hover:underline"
              >
                See more on Instagram <ArrowUpRight className="size-4" />
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
