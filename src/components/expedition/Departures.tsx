import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  PRICE_PHP,
  ROUTES,
  chatLink,
  formatDate,
  formatPeso,
  upcomingDepartures,
  type Direction,
} from "@/data/expedition";
import { asset } from "@/lib/asset";
import { captureLead } from "@/lib/booking.functions";
import { cn } from "@/lib/utils";
import { useBooking } from "./Booking";
import { seatsLabel, useAvailability } from "./useAvailability";
import { Reveal } from "./Reveal";
import { Wave } from "./Wave";

const CARDS: { direction: Direction; image: string; alt: string }[] = [
  {
    direction: "elnido-coron",
    image: "media/card-elnido-coron.webp",
    alt: "Aerial view of El Nido's limestone islands and turquoise lagoons",
  },
  {
    direction: "coron-elnido",
    image: "media/card-coron-elnido.webp",
    alt: "Orange sunset over the palm-lined beach at Nacpan, El Nido",
  },
];

export function Departures() {
  const book = useBooking();
  const availability = useAvailability();

  return (
    <section
      id="departures"
      aria-labelledby="departures-title"
      className="relative bg-lapis text-cream"
    >
      <Wave fill="var(--lapis)" className="absolute inset-x-0 bottom-full" />
      <div className="mx-auto max-w-[1320px] px-3 pb-20 pt-10 md:px-6 md:pb-28 md:pt-14">
        <Reveal className="text-center">
          <h2 id="departures-title" className="display text-[clamp(2.9rem,7vw,6.4rem)]">
            Upcoming departures
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[1.05rem] text-cream/80">
            Two directions, same islands. Pick your end of Palawan.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-4 md:mt-14 md:grid-cols-3">
          {CARDS.map((card, i) => {
            const route = ROUTES[card.direction];
            const dates = upcomingDepartures(card.direction);
            return (
              <Reveal
                key={card.direction}
                delay={i * 80}
                as="article"
                className="flex flex-col overflow-hidden rounded-[1.25rem] bg-cream text-midnight"
              >
                <div className="relative aspect-[4/3]">
                  <img
                    src={asset(card.image)}
                    alt={card.alt}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <p className="absolute inset-x-0 bottom-0 bg-midnight/55 px-5 py-3 text-center text-lg font-bold text-cream backdrop-blur-sm">
                    {route.label}
                  </p>
                </div>
                <div className="flex flex-1 flex-col p-5 md:p-6">
                  <dl className="fine grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                    <dt className="font-bold">Meet</dt>
                    <dd className="text-ink-soft">{route.meet}</dd>
                    <dt className="font-bold">Finish</dt>
                    <dd className="text-ink-soft">{route.finish}</dd>
                  </dl>
                  <p className="kicker mt-5 text-lapis">Next departures</p>
                  {dates.length ? (
                    <ul className="mt-2.5 flex flex-wrap gap-2">
                      {dates.map((d) => {
                        const seats = availability?.[d.id];
                        const note = seatsLabel(seats);
                        return (
                          <li key={d.id}>
                            <button
                              type="button"
                              disabled={seats === 0}
                              onClick={() => book({ direction: card.direction, departureId: d.id })}
                              className="rounded-full bg-sand px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-chartreuse disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-sand"
                            >
                              <span className={seats === 0 ? "line-through" : undefined}>
                                {formatDate(d.date, d.date.startsWith("2027"))}
                              </span>
                              {note && (
                                <span className="ml-1.5 font-bold text-lapis">· {note}</span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="fine mt-2 text-ink-soft">New dates dropping soon.</p>
                  )}
                  <div className="mt-auto flex items-end justify-between gap-3 pt-6">
                    <p className="leading-tight">
                      <span className="fine block text-ink-soft">Per person</span>
                      <span className="text-2xl font-extrabold">{formatPeso(PRICE_PHP)}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => book({ direction: card.direction })}
                      className="btn-cta"
                    >
                      Book <ArrowRight className="size-4" />
                    </button>
                  </div>
                </div>
              </Reveal>
            );
          })}
          <Reveal delay={160}>
            <LeadCard />
          </Reveal>
        </div>
      </div>
      <Wave fill="var(--cream)" flip className="-mb-px" />
    </section>
  );
}

function LeadCard() {
  const save = useServerFn(captureLead);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [interest, setInterest] = useState<Direction | "either">("either");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "done" | "invalid" | "not_live" | "error"
  >("idle");
  const chat = chatLink();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const hasEmail = /\S+@\S+\.\S+/.test(email);
    const hasPhone = whatsapp.replace(/\D/g, "").length >= 7;
    if (!hasEmail && !hasPhone) {
      setStatus("invalid");
      return;
    }
    setStatus("sending");
    try {
      const res = await save({ data: { email, whatsapp, interest, company } });
      setStatus(res.ok ? "done" : res.reason === "leads_not_live" ? "not_live" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="flex h-full min-h-[420px] flex-col justify-center rounded-[1.25rem] bg-chartreuse p-6 text-midnight md:p-8">
        <span className="grid size-12 place-items-center rounded-full bg-midnight text-chartreuse">
          <Check className="size-6" strokeWidth={3} />
        </span>
        <p className="display mt-5 text-5xl">You're on the list</p>
        <p className="mt-3 leading-relaxed">
          We'll send new dates as soon as they drop. Pack light.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex h-full flex-col rounded-[1.25rem] bg-chartreuse p-6 text-midnight md:p-7"
      noValidate
    >
      <p className="kicker">Not ready to book?</p>
      <p className="display mt-2 text-[3rem] md:text-[3.4rem]">Get the dates first</p>
      <p className="fine mt-2 text-midnight/80">
        Leave an email or a WhatsApp number and we'll message you when new departures open.
      </p>

      <div className="mt-5 space-y-2.5">
        <label className="block">
          <span className="sr-only">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="Email"
            className="h-12 w-full rounded-xl border-0 bg-cream px-3.5 text-base outline-none ring-midnight focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="sr-only">WhatsApp number</span>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            autoComplete="tel"
            placeholder="or WhatsApp number"
            className="h-12 w-full rounded-xl border-0 bg-cream px-3.5 text-base outline-none ring-midnight focus:ring-2"
          />
        </label>
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="hidden"
          aria-hidden
        />
        <div
          className="flex flex-wrap gap-1.5 pt-1"
          role="radiogroup"
          aria-label="Which direction?"
        >
          {(["either", "elnido-coron", "coron-elnido"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={interest === v}
              onClick={() => setInterest(v)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                interest === v ? "bg-midnight text-cream" : "bg-cream/60 hover:bg-cream",
              )}
            >
              {v === "either" ? "Either way" : ROUTES[v].label}
            </button>
          ))}
        </div>
      </div>

      {status === "invalid" && (
        <p className="fine mt-3 font-semibold">
          Add an email or a WhatsApp number so we can reach you.
        </p>
      )}
      {status === "not_live" && (
        <p className="fine mt-3">
          Sign-ups open very soon. For now:{" "}
          <a
            href={chat.href}
            target="_blank"
            rel="noreferrer"
            className="font-bold underline underline-offset-2"
          >
            {chat.label}
          </a>
          .
        </p>
      )}
      {status === "error" && (
        <p className="fine mt-3 font-semibold">That didn't send. Give it another go.</p>
      )}

      <div className="mt-auto pt-5">
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-midnight px-5 text-[0.95rem] font-bold text-cream transition-transform hover:-translate-y-px disabled:opacity-60"
        >
          {status === "sending" ? <Loader2 className="size-4 animate-spin" /> : null}
          Send me the dates
        </button>
      </div>
    </form>
  );
}
