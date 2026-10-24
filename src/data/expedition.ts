// Single source for everything the page says about the expedition.
// Sources: Lexie's website brief (19 Oct 2026) and the Palawan Expedition
// launch proposal. Change prices or dates here and the page follows; the
// checkout server function charges from PRICE_PHP below, never the browser.

export type Direction = "elnido-coron" | "coron-elnido";

export const PRICE_PHP = 19000;
export const MAX_GUESTS_PER_TRIP = 20;
export const MAX_GUESTS_PER_BOOKING = 10;

// Contact. WhatsApp number not supplied yet: while it is empty, chat buttons
// fall back to an Instagram DM.
export const WHATSAPP_NUMBER = "";
export const INSTAGRAM_URL = "https://instagram.com/madmonkeyhostels";
export const INSTAGRAM_HANDLE = "@madmonkeyhostels";

export function chatLink(
  message = "Hi Mad Monkey! I've got a question about the Palawan Expedition.",
) {
  if (WHATSAPP_NUMBER) {
    return {
      href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      label: "Chat on WhatsApp",
    };
  }
  return { href: INSTAGRAM_URL, label: "DM us on Instagram" };
}

export const ROUTES: Record<
  Direction,
  {
    from: string;
    to: string;
    label: string;
    short: string;
    meet: string;
    briefing: string;
    finish: string;
  }
> = {
  "elnido-coron": {
    from: "El Nido",
    to: "Coron",
    label: "El Nido → Coron",
    short: "From El Nido",
    meet: "Mad Monkey Nacpan Beach, 8AM",
    briefing: "6PM the night before at Mad Monkey Nacpan Beach",
    finish: "Arrive Coron around 4PM",
  },
  "coron-elnido": {
    from: "Coron",
    to: "El Nido",
    label: "Coron → El Nido",
    short: "From Coron",
    meet: "Coron Port, 8AM",
    briefing: "6PM the night before at Tribu Kuridas Bar, Coron",
    finish: "Back at Mad Monkey Nacpan in time for sunset",
  },
};

// Proposal schedule: 7 departures a month from December. Only the December
// calendar has been confirmed so far; add new dates here as they're locked.
export const DEPARTURES: { id: string; direction: Direction; date: string }[] = [
  { id: "enc-2026-12-01", direction: "elnido-coron", date: "2026-12-01" },
  { id: "ce-2026-12-05", direction: "coron-elnido", date: "2026-12-05" },
  { id: "enc-2026-12-10", direction: "elnido-coron", date: "2026-12-10" },
  { id: "ce-2026-12-14", direction: "coron-elnido", date: "2026-12-14" },
  { id: "enc-2026-12-19", direction: "elnido-coron", date: "2026-12-19" },
  { id: "ce-2026-12-23", direction: "coron-elnido", date: "2026-12-23" },
  { id: "enc-2026-12-28", direction: "elnido-coron", date: "2026-12-28" },
  { id: "ce-2027-01-01", direction: "coron-elnido", date: "2027-01-01" },
];

// Today's date in Palawan, as YYYY-MM-DD. Same answer on server and client,
// so the departure list never differs between SSR and hydration.
export function todayInManila() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
}

export function upcomingDepartures(direction?: Direction) {
  const today = todayInManila();
  return DEPARTURES.filter((d) => d.date > today && (!direction || d.direction === direction));
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(iso: string, withYear = false) {
  const [y = 0, m = 1, d = 1] = iso.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${weekday} ${d} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ""}`;
}

export function formatPeso(amount: number) {
  return `₱${amount.toLocaleString("en-US")}`;
}

// The route in El Nido → Coron order. Coron → El Nido runs the same legs in
// reverse (proposal: "two routes, same itinerary").
const LEGS = [
  {
    places: ["El Nido", "Linapacan"],
    stops: ["Darocotan Island", "Tacling Island", "Ginto Island", "Local fishing village"],
    blurb:
      "The El Nido end of the route: empty white-sand islands and a stop in a fishing village most boats never reach.",
    image: "media/day-1.webp",
    alt: "Aerial view of a traditional bangka boat on open blue water off Palawan",
  },
  {
    places: ["Linapacan", "Culion"],
    stops: [
      "Bulawit (Turtle Island)",
      "Cagdanao Island",
      "Doble Nuebe cliff jumping",
      "Patoyo Island",
    ],
    blurb:
      "The middle day is the wild one. Snorkel with turtles at Bulawit, then throw yourself off the cliffs at Doble Nuebe.",
    image: "media/day-2.webp",
    alt: "A sea turtle gliding over coral",
  },
  {
    places: ["Culion", "Coron"],
    stops: ["Araw Beach", "Ditaytayan Sandbar", "Bulog Dos or Malcapuya", "Banana Island"],
    blurb:
      "The Coron end: Ditaytayan's sandbar, powder-white Malcapuya and Banana Island, all in one day.",
    image: "media/day-3.webp",
    alt: "Aerial view of a white sandbar and reef with a boat anchored off the beach",
  },
];

const CAMPS: Record<string, string> = {
  Linapacan: "Linapacan Tourist Camp",
  Culion: "Diamoon Culion Camp",
};

export function itinerary(direction: Direction) {
  const legs = direction === "elnido-coron" ? LEGS : [...LEGS].reverse();
  return legs.map((leg, i) => {
    const [from = "", to = ""] =
      direction === "elnido-coron" ? leg.places : [...leg.places].reverse();
    const stops = direction === "elnido-coron" ? leg.stops : [...leg.stops].reverse();
    let start: string | undefined;
    let end: string;
    if (i === 0) {
      start =
        direction === "elnido-coron"
          ? "8AM pick-up at Mad Monkey Nacpan, then a 30 minute van ride to San Fernando Port."
          : "8AM departure from Coron Port.";
    }
    if (i < 2) {
      end = `Night at ${CAMPS[to]}: beachfront huts, dinner from the crew, karaoke or a bonfire.`;
    } else {
      end =
        direction === "elnido-coron"
          ? "Land in Coron around 4PM, sunburnt and with a new group chat."
          : "Land at San Fernando Port around 4PM and van back to Mad Monkey Nacpan in time for sunset.";
    }
    return {
      day: i + 1,
      from,
      to,
      stops,
      blurb: leg.blurb,
      start,
      end,
      image: leg.image,
      alt: leg.alt,
    };
  });
}

export const INCLUDED = [
  {
    title: "Boat & crew",
    icon: "ship",
    items: [
      "The boat between El Nido and Coron",
      "Captain plus a 6-person crew, including guide and chef",
      "2 Mad Monkey hosts on every trip",
      "Van between Mad Monkey Nacpan and San Fernando Port",
    ],
  },
  {
    title: "Two nights on the beach",
    icon: "tent",
    items: [
      "Beachfront camps at Linapacan and Culion",
      "Your own native hut (couples can share)",
      "Toilets, showers and a communal dining area",
    ],
  },
  {
    title: "Food & drinks",
    icon: "utensils",
    items: [
      "2 breakfasts, 3 lunches, 2 dinners, cooked onboard",
      "Drinking water and coffee all trip",
      "Free rum and iced tea at camp",
      "A rum and coke on us at the briefing",
    ],
  },
  {
    title: "Things to do",
    icon: "waves",
    items: [
      "3 to 5 island stops a day",
      "Snorkelling, cliff jumping, kayaking, line fishing",
      "Village visits, volleyball, games, karaoke, bonfires",
      "Island and eco fees along the route",
    ],
  },
  {
    title: "Gear",
    icon: "shield",
    items: ["Snorkel gear and kayak", "Towels onboard", "Safety equipment and a safety briefing"],
  },
] as const;

export const NOT_INCLUDED = [
  "El Nido environmental fee (₱400) and Coron environmental fee (₱200)",
  "Extra drinks and beers",
  "Travel insurance",
  "Getting around Coron town",
];

export const FAQS = [
  {
    q: "Who's this trip for?",
    a: "Solo travellers and small groups who want the islands and the people to share them with. Most guests join on their own. Nobody stays a stranger past the first lunch.",
  },
  {
    q: "Is there an age limit?",
    a: "You need to be 18 or over to join the expedition.",
  },
  {
    q: "What happens at the briefing?",
    a: "It's at 6PM the night before you leave: Mad Monkey Nacpan Beach if you're starting in El Nido, Tribu Kuridas Bar if you're starting in Coron. We sign waivers, run the safety talk, check the weather and the route, go through what to bring, and you meet everyone you'll be stuck with for three days. First rum and coke is on us. It's mandatory: if you miss it, you'll sign in the morning before we go.",
  },
  {
    q: "What should I pack?",
    a: "Swimwear, reef-safe sunscreen, a hat, sunnies, a light long-sleeve for the sun, a small dry bag for your phone and cash, a power bank, insect repellent, sandals you can wade in, and cash for extra drinks and the El Nido and Coron environmental fees. Snorkel gear and towels are on the boat.",
  },
  {
    q: "I get seasick. Should I worry?",
    a: "Some crossings between islands are open sea and can get bumpy. If you're prone to it, take a seasickness tablet before we leave each morning, stay up on deck in the fresh air and keep your eyes on the horizon. Tell your hosts at the briefing and they'll look after you.",
  },
  {
    q: "What if the weather turns?",
    a: "That's why there's no fixed itinerary. The captain and crew pick the stops on the day based on wind and swell, so expect 3 to 5 stops a day but not always the ones listed. If it isn't safe to cross, we don't go, and we'll contact you directly about your options.",
  },
  {
    q: "What do I do with my luggage?",
    a: "Your bag travels with you. There's storage space on the boat, but it's an island-hopping boat, not a cruise ship, so a soft backpack beats a hard suitcase. Keep valuables in your dry bag.",
  },
  {
    q: "What are the camps like?",
    a: "Simple and right on the sand: native fan huts with water and electricity, toilets, showers and a communal dining area, with sunset views from the beach. Power runs off a generator in the evening (6PM to 6AM at Linapacan, 6PM to 10:30PM at Culion). You get your own hut, and couples can share on request.",
  },
  {
    q: "Who runs the boat?",
    a: "Our partners at MeetMe Tours, El Nido island-hopping specialists. Their boat is registered for 26 guests and we cap every trip at 20, so there's room to spread out. Two Mad Monkey hosts come on every expedition.",
  },
  {
    q: "How do I pay?",
    a: "Book online and pay by card through Stripe. It's ₱19,000 per person, and everything on this page is included apart from the few things listed under not included.",
  },
];
