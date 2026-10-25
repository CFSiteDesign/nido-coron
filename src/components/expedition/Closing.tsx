import { ArrowRight, Instagram, MessageCircle } from "lucide-react";
import { INSTAGRAM_URL, WHATSAPP_NUMBER, chatLink } from "@/data/expedition";
import logo from "@/assets/mad-monkey-logo.png";
import { useBooking } from "./Booking";
import { LoopVideo } from "./LoopVideo";

export function FooterCta() {
  const book = useBooking();
  const chat = chatLink();
  const ChatIcon = WHATSAPP_NUMBER ? MessageCircle : Instagram;

  return (
    <section aria-labelledby="cta-title" className="bg-sand px-3 pb-3 md:px-6 md:pb-6">
      <div className="relative mx-auto flex min-h-[78svh] max-w-[1320px] items-end overflow-hidden rounded-[1.5rem] md:min-h-[640px] md:rounded-[2rem]">
        <div className="absolute inset-0">
          <LoopVideo
            src="media/sunset-wide.mp4"
            srcPortrait="media/sunset-tall.mp4"
            poster="media/sunset-tall.webp"
            label="Waves rolling onto a palm-lined beach under an orange sunset"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-midnight/85 via-midnight/25 to-midnight/10" />
        <div className="relative w-full p-6 text-cream md:p-12">
          <p className="kicker text-chartreuse">6PM, the night before</p>
          <h2 id="cta-title" className="display mt-3 max-w-[12ch] text-[clamp(3.4rem,10vw,9rem)]">
            See you at the briefing
          </h2>
          <p className="mt-4 max-w-md text-[1.05rem] leading-relaxed text-cream/85">
            Twenty spots a boat. Grab yours, then grab your swimmers.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => book()} className="btn-cta">
              Book now <ArrowRight className="size-4" />
            </button>
            <a
              href={chat.href}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost text-cream hover:bg-cream/10"
            >
              <ChatIcon className="size-4" /> {chat.label}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-sand px-3 pb-24 pt-10 md:px-6 md:pb-12 md:pt-14">
      <div className="mx-auto grid max-w-[1320px] grid-cols-12 gap-y-8 md:gap-x-10">
        <div className="col-span-12 flex flex-col gap-4 sm:flex-row sm:items-center md:col-span-5">
          <img
            src={logo}
            alt="Mad Monkey"
            className="h-12 w-auto self-start sm:self-center"
            width={600}
            height={226}
          />
          <p className="leading-snug">
            <span className="block text-lg font-extrabold">Mad Monkey Palawan Expedition</span>
            <span className="fine block text-ink-soft">
              El Nido ⇄ Coron, 3 days and 2 nights by boat. Run with MeetMe Tours.
            </span>
          </p>
        </div>
        <nav aria-label="Footer" className="col-span-6 md:col-span-3">
          <p className="kicker text-ink-soft">The trip</p>
          <ul className="mt-3 space-y-1.5 font-semibold">
            <li>
              <a href="#itinerary" className="hover:underline">
                Itinerary
              </a>
            </li>
            <li>
              <a href="#included" className="hover:underline">
                What's included
              </a>
            </li>
            <li>
              <a href="#departures" className="hover:underline">
                Departures
              </a>
            </li>
            <li>
              <a href="#faq" className="hover:underline">
                FAQ
              </a>
            </li>
          </ul>
        </nav>
        <div className="col-span-6 md:col-span-4">
          <p className="kicker text-ink-soft">Say hi</p>
          <ul className="mt-3 space-y-1.5 font-semibold">
            <li>
              <a
                href={chatLink().href}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                {chatLink().label}
              </a>
            </li>
            <li>
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="hover:underline">
                Instagram
              </a>
            </li>
            <li>
              <a
                href="https://madmonkeyhostels.com"
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                madmonkeyhostels.com
              </a>
            </li>
          </ul>
        </div>
        <p className="fine col-span-12 border-t border-midnight/15 pt-6 text-ink-soft">
          © {new Date().getFullYear()} Mad Monkey Hostels. Itinerary is an example: stops depend on
          weather and sea conditions on the day.
        </p>
      </div>
    </footer>
  );
}
