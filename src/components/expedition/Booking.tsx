import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Loader2, Minus, Plus, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  MAX_GUESTS_PER_BOOKING,
  PRICE_PHP,
  ROUTES,
  chatLink,
  formatDate,
  formatPeso,
  upcomingDepartures,
  type Direction,
} from "@/data/expedition";
import { createCheckout } from "@/lib/booking.functions";
import { cn } from "@/lib/utils";
import { AVAILABILITY_KEY, seatsLabel, useAvailability } from "./useAvailability";

type OpenOptions = { direction?: Direction; departureId?: string };
const BookingContext = createContext<(opts?: OpenOptions) => void>(() => {});

export function useBooking() {
  return useContext(BookingContext);
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<OpenOptions>({});
  const [session, setSession] = useState(0);

  const openBooking = useCallback((opts: OpenOptions = {}) => {
    setPreset(opts);
    setSession((n) => n + 1);
    setOpen(true);
  }, []);

  return (
    <BookingContext.Provider value={openBooking}>
      {children}
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-midnight/60 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
          <DialogPrimitive.Content
            className={cn(
              "fixed z-50 flex max-h-[92dvh] w-full flex-col overflow-hidden bg-cream text-midnight shadow-2xl outline-none",
              "inset-x-0 bottom-0 rounded-t-[1.75rem]",
              "md:inset-auto md:left-1/2 md:top-1/2 md:max-w-[560px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[1.75rem]",
              "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-8 data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            )}
          >
            <BookingForm key={session} preset={preset} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </BookingContext.Provider>
  );
}

function BookingForm({ preset }: { preset: OpenOptions }) {
  const checkout = useServerFn(createCheckout);
  const [direction, setDirection] = useState<Direction>(preset.direction ?? "elnido-coron");
  const departures = useMemo(() => upcomingDepartures(direction), [direction]);
  const [departureId, setDepartureId] = useState<string | undefined>(preset.departureId);
  const [guests, setGuests] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "not_live" | "error" | "unavailable" | "sold_out"
  >("idle");
  const [spotsLeftOnFail, setSpotsLeftOnFail] = useState(0);
  const availability = useAvailability();
  const queryClient = useQueryClient();

  const selected = departures.find((d) => d.id === departureId);
  const left = selected ? availability?.[selected.id] : undefined;
  const soldOut = left === 0;
  const maxGuests = Math.max(1, Math.min(MAX_GUESTS_PER_BOOKING, left ?? MAX_GUESTS_PER_BOOKING));

  // Keep the group size inside what's actually left on the chosen date.
  useEffect(() => {
    setGuests((g) => Math.min(g, maxGuests));
  }, [maxGuests]);
  const total = PRICE_PHP * guests;
  const route = ROUTES[direction];
  const chat = chatLink(
    selected
      ? `Hi Mad Monkey! I'd like ${guests} spot${guests > 1 ? "s" : ""} on the Palawan Expedition, ${route.label}, ${formatDate(selected.date, true)}.`
      : undefined,
  );

  const pickDirection = (d: Direction) => {
    setDirection(d);
    setDepartureId(undefined);
    setStatus("idle");
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setStatus("sending");
    try {
      const res = await checkout({
        data: { departureId: selected.id, guests, name, email, whatsapp },
      });
      if (res.ok) {
        window.location.assign(res.url);
        return;
      }
      if (res.reason === "sold_out") {
        setSpotsLeftOnFail(res.seatsLeft);
        setStatus("sold_out");
        void queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEY });
        return;
      }
      setStatus(
        res.reason === "payments_not_live"
          ? "not_live"
          : res.reason === "departure_unavailable"
            ? "unavailable"
            : "error",
      );
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 pb-4 pt-5 md:px-7 md:pt-7">
        <div>
          <p className="kicker text-lapis">3 days · 2 nights · max 20 guests</p>
          <DialogPrimitive.Title className="display mt-1 text-[2.6rem] md:text-5xl">
            Book your spot
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Choose a direction, a departure date and how many people are coming, then pay securely
            with Stripe.
          </DialogPrimitive.Description>
        </div>
        <DialogPrimitive.Close
          type="button"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-sand transition-colors hover:bg-powder-soft"
          aria-label="Close"
        >
          <X className="size-5" />
        </DialogPrimitive.Close>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 md:px-7">
        <fieldset>
          <legend className="kicker mb-2.5 text-ink-soft">1. Which way?</legend>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(ROUTES) as Direction[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => pickDirection(d)}
                aria-pressed={direction === d}
                className={cn(
                  "rounded-2xl px-3 py-3 text-left transition-colors",
                  direction === d ? "bg-midnight text-cream" : "bg-sand hover:bg-powder-soft",
                )}
              >
                <span className="block text-[0.95rem] font-bold">{ROUTES[d].label}</span>
                <span
                  className={cn("fine block", direction === d ? "text-cream/70" : "text-ink-soft")}
                >
                  Meet: {ROUTES[d].meet}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="kicker mb-2.5 text-ink-soft">2. Pick a departure</legend>
          {departures.length ? (
            <div className="flex flex-wrap gap-2">
              {departures.map((d) => {
                const seats = availability?.[d.id];
                const note = seatsLabel(seats);
                return (
                  <button
                    key={d.id}
                    type="button"
                    disabled={seats === 0}
                    onClick={() => {
                      setDepartureId(d.id);
                      setStatus("idle");
                    }}
                    aria-pressed={departureId === d.id}
                    className={cn(
                      "rounded-full px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 disabled:line-through",
                      departureId === d.id
                        ? "bg-chartreuse text-midnight shadow-[inset_0_0_0_1.5px_var(--midnight)]"
                        : "bg-sand hover:bg-powder-soft",
                    )}
                  >
                    {formatDate(d.date, true)}
                    {note && (
                      <span className="ml-1.5 font-bold text-lapis no-underline">· {note}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="fine text-ink-soft">
              New dates for this direction are on the way. Message us and we'll let you know first.
            </p>
          )}
          <p className="fine mt-2.5 text-ink-soft">Briefing {route.briefing}.</p>
        </fieldset>

        <fieldset>
          <legend className="kicker mb-2.5 text-ink-soft">3. How many of you?</legend>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
              className="grid size-11 place-items-center rounded-full bg-sand hover:bg-powder-soft disabled:opacity-40"
              disabled={guests <= 1}
              aria-label="One less guest"
            >
              <Minus className="size-4" />
            </button>
            <output className="w-10 text-center text-2xl font-bold tabular-nums" aria-live="polite">
              {guests}
            </output>
            <button
              type="button"
              onClick={() => setGuests((g) => Math.min(maxGuests, g + 1))}
              className="grid size-11 place-items-center rounded-full bg-sand hover:bg-powder-soft disabled:opacity-40"
              disabled={guests >= maxGuests}
              aria-label="One more guest"
            >
              <Plus className="size-4" />
            </button>
            <span className="fine text-ink-soft">
              {guests === 1 ? "Solo? You're in good company." : `${formatPeso(PRICE_PHP)} each`}
            </span>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="kicker mb-2.5 text-ink-soft">4. Your details</legend>
          <Field label="Full name" value={name} onChange={setName} autoComplete="name" required />
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
          />
          <Field
            label="WhatsApp number (optional)"
            type="tel"
            value={whatsapp}
            onChange={setWhatsapp}
            autoComplete="tel"
            placeholder="+63 ..."
          />
        </fieldset>

        {status === "not_live" && (
          <Notice>
            Online payments open very soon. Send us a message with your date and we'll hold your
            spot.{" "}
            <a
              href={chat.href}
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline underline-offset-2"
            >
              {chat.label}
            </a>
          </Notice>
        )}
        {status === "sold_out" && (
          <Notice>
            {spotsLeftOnFail === 0
              ? "Someone just grabbed the last spots on that date. Pick another departure above."
              : `Only ${spotsLeftOnFail} spot${spotsLeftOnFail === 1 ? "" : "s"} left on that date. Bring your group down to ${spotsLeftOnFail} or pick another departure.`}
          </Notice>
        )}
        {status === "unavailable" && (
          <Notice>That departure has just closed. Pick another date above.</Notice>
        )}
        {status === "error" && (
          <Notice>
            Something went wrong on our side. Try again, or reach us here:{" "}
            <a
              href={chat.href}
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline underline-offset-2"
            >
              {chat.label}
            </a>
            .
          </Notice>
        )}
      </div>

      <div className="border-t border-border bg-cream px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 md:px-7 md:pb-7">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="fine text-ink-soft">
            {selected ? `${route.label} · ${formatDate(selected.date)}` : "Choose a departure"}
          </span>
          <span className="text-xl font-extrabold tabular-nums">{formatPeso(total)}</span>
        </div>
        <button
          type="submit"
          className="btn-cta w-full disabled:opacity-50"
          disabled={!selected || soldOut || status === "sending"}
        >
          {status === "sending" ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Opening secure checkout
            </>
          ) : (
            <>
              Pay {formatPeso(total)} securely <ArrowRight className="size-4" />
            </>
          )}
        </button>
        <p className="fine mt-2 text-center text-ink-soft">
          Card payment by Stripe. Your spots are held for 30 minutes while you pay.
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="fine mb-1 block font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-xl border border-input bg-card px-3.5 text-base outline-none transition-shadow focus:border-lapis focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--lapis)_20%,transparent)]"
        {...rest}
      />
    </label>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return <p className="fine rounded-2xl bg-powder-soft px-4 py-3 text-midnight">{children}</p>;
}
