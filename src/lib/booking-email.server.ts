// Server-only booking emails, sent with Resend once a booking is paid: a
// confirmation to the guest and a heads-up to staff. Set in the hosting
// environment, never in the repo (it's public):
//   RESEND_API_KEY        Resend API key; without it no emails go out
//   BOOKING_STAFF_EMAILS  comma-separated staff addresses
//   BOOKING_EMAIL_FROM    optional sender, on a domain verified in Resend
import {
  FAQS,
  NOT_INCLUDED,
  ROUTES,
  chatLink,
  formatDate,
  formatPeso,
  type Direction,
} from "@/data/expedition";
import { serverEnv } from "./stripe.server";

const SITE_URL = "https://coron-expedition-nest.lovable.app";
const DEFAULT_FROM =
  "Mad Monkey Palawan Expedition <PalawanExpedition@experience.madmonkeyhostels.com>";
const DEFAULT_STAFF = "cs@madmonkeyhostels.com";
const GUEST_REPLY_TO = "cs@madmonkeyhostels.com";

// The site's tokens (src/styles.css) as hex, because email clients can't read oklch.
const MIDNIGHT = "#132441";
const CHARTREUSE = "#DAF561";
const POWDER = "#87BBD7";
const CREAM = "#FAF6F1";
const CARD = "#FDFBF9";
const SOFT = "#4A5670";
const LINE = "#DCDDDF";
const NAV_RULE = "#6A95B2";
const FONTS =
  "https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800&amp;family=Barlow+Condensed:wght@600&amp;display=swap";
const DISPLAY = "'Barlow Condensed','Arial Narrow','Helvetica Neue',Arial,sans-serif";
const BODY = "Barlow,'Helvetica Neue',Arial,sans-serif";

export type BookingEmailData = {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string | null;
  direction: string;
  departureDate: string;
  guests: number;
  paidPhp: number;
  seatsLeft: number;
  paymentId: string | null;
  // A sandbox payment: no real money moved, so nobody should act on it.
  test: boolean;
};

type Email = { subject: string; html: string; text: string };

export function emailConfigured() {
  return Boolean(serverEnv("RESEND_API_KEY"));
}

export function staffEmails() {
  const list = (serverEnv("BOOKING_STAFF_EMAILS") ?? DEFAULT_STAFF)
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
  return list.length ? list : [DEFAULT_STAFF];
}

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function esc(value: string) {
  return value.replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c);
}

function routeOf(direction: string) {
  const key: Direction = direction === "coron-elnido" ? "coron-elnido" : "elnido-coron";
  return ROUTES[key];
}

function dayBefore(iso: string) {
  const [y = 0, m = 1, d = 1] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
}

const reference = (id: string) => id.slice(0, 8).toUpperCase();
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function detailRows(rows: [string, string][]) {
  const cells = rows
    .map(
      ([label, value]) => `<tr>
        <td style="padding:10px 12px 10px 0;border-bottom:1px solid ${LINE};font:13px/1.4 ${BODY};color:${SOFT};vertical-align:top;white-space:nowrap">${esc(label)}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${LINE};font:600 15px/1.4 ${BODY};color:${MIDNIGHT};vertical-align:top">${value}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px">${cells}</table>`;
}

function shell(data: BookingEmailData, preheader: string, body: string) {
  const testBanner = data.test
    ? `<tr><td style="background:${MIDNIGHT};padding:10px 28px;font:700 13px/1.4 ${BODY};color:${CHARTREUSE}">TEST BOOKING: sandbox payment, no real money moved. Please ignore.</td></tr>`
    : "";
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><link rel="stylesheet" href="${FONTS}"></head>
<body style="margin:0;padding:0;background:${CREAM}">
<div style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM}"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${CARD};border-radius:20px;overflow:hidden">
    <tr><td style="background:${POWDER};padding:16px 24px"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="padding-right:14px"><img src="${SITE_URL}/media/mad-monkey-logo.png" width="104" height="39" alt="Mad Monkey" style="display:block;border:0"></td>
      <td style="border-left:1px solid ${NAV_RULE};padding-left:14px">
        <div style="font:800 15px/1.25 ${BODY};letter-spacing:-0.01em;color:${MIDNIGHT}">Palawan Expedition</div>
        <div style="font:13px/1.35 ${BODY};color:${MIDNIGHT}">El Nido ⇄ Coron</div>
      </td>
    </tr></table></td></tr>
    ${testBanner}
    <tr><td style="padding:28px">${body}</td></tr>
  </table>
  <p style="max-width:560px;margin:16px auto 0;font:12px/1.5 ${BODY};color:${SOFT}">Mad Monkey Palawan Expedition, run with MeetMe Tours.</p>
</td></tr></table>
</body>
</html>`;
}

// Same look as the booking panel and success notice on the site.
function hero(title: string, intro: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px"><tr><td style="background:${CHARTREUSE};border-radius:20px;padding:24px 22px">
      <h1 style="margin:0 0 10px;font:600 48px/0.95 ${DISPLAY};letter-spacing:-0.005em;text-transform:uppercase;color:${MIDNIGHT}">${esc(title)}</h1>
      <p style="margin:0;font:16px/1.55 ${BODY};color:${MIDNIGHT}">${esc(intro)}</p>
    </td></tr></table>`;
}

function paragraph(html: string) {
  return `<p style="margin:0 0 20px;font:16px/1.55 ${BODY};color:${MIDNIGHT}">${html}</p>`;
}

function heading(text: string) {
  return `<h2 style="margin:0 0 8px;font:600 26px/1 ${DISPLAY};letter-spacing:-0.005em;text-transform:uppercase;color:${MIDNIGHT}">${esc(text)}</h2>`;
}

// The site's .btn-cta.
function button(href: string, label: string) {
  return `<a href="${esc(href)}" style="display:inline-block;background:${CHARTREUSE};border:1.5px solid ${MIDNIGHT};border-radius:999px;padding:13px 22px;font:700 15px/1.2 ${BODY};letter-spacing:0.01em;color:${MIDNIGHT};text-decoration:none">${esc(label)}</a>`;
}

const PACKING = FAQS.find((faq) => faq.q === "What should I pack?")?.a ?? "";

export function guestEmail(data: BookingEmailData): Email {
  const route = routeOf(data.direction);
  const firstName = data.fullName.split(/\s+/)[0] ?? data.fullName;
  const departs = formatDate(data.departureDate, true);
  const briefingNight = formatDate(dayBefore(data.departureDate));
  const chat = chatLink();
  const ref = reference(data.id);
  const spots = plural(data.guests, "spot");
  const paid = formatPeso(data.paidPhp);

  const html = shell(
    data,
    `${spots} on ${route.label}, ${departs}. Briefing at 6PM the night before.`,
    `${hero(
      "You're on the boat!",
      `Hi ${firstName}, you're booked on the Mad Monkey Palawan Expedition: three days and two nights by boat. Here's what you need to know.`,
    )}
    ${detailRows([
      ["Route", esc(route.label)],
      ["Departs", esc(`${departs}, ${route.meet}`)],
      ["Finish", esc(route.finish)],
      ["Booked", esc(spots)],
      ["Paid", esc(paid)],
      ["Booking ref", esc(ref)],
    ])}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px"><tr><td style="background:${MIDNIGHT};border-radius:20px;padding:22px">
      <p style="margin:0 0 8px;font:600 12px/1.3 ${BODY};letter-spacing:0.16em;text-transform:uppercase;color:${CHARTREUSE}">Your briefing</p>
      <p style="margin:0 0 10px;font:600 30px/1 ${DISPLAY};letter-spacing:-0.005em;text-transform:uppercase;color:${CREAM}">${esc(route.briefing)}</p>
      <p style="margin:0;font:15px/1.5 ${BODY};color:${CREAM}">That's ${esc(briefingNight)}. We sign waivers, run the safety talk and you meet the crew. First rum and coke is on us. It's mandatory: if you miss it, you'll sign in the morning before we go.</p>
    </td></tr></table>
    ${heading("What to pack")}
    ${paragraph(esc(PACKING))}
    ${heading("Not included")}
    ${paragraph(NOT_INCLUDED.map(esc).join("<br>"))}
    ${paragraph("We'll be in touch before the briefing. Questions? Reply to this email, or:")}
    ${button(chat.href, chat.label)}`,
  );

  const text = [
    data.test ? "TEST BOOKING: sandbox payment, no real money moved. Please ignore.\n" : "",
    `You're on the boat!`,
    "",
    `Hi ${firstName}, you're booked on the Mad Monkey Palawan Expedition.`,
    "",
    `Route: ${route.label}`,
    `Departs: ${departs}, ${route.meet}`,
    `Finish: ${route.finish}`,
    `Booked: ${spots}`,
    `Paid: ${paid}`,
    `Booking ref: ${ref}`,
    "",
    `Your briefing: ${route.briefing} (${briefingNight}). It's mandatory: if you miss it, you'll sign in the morning before we go.`,
    "",
    `What to pack: ${PACKING}`,
    "",
    "Not included:",
    ...NOT_INCLUDED,
    "",
    `We'll be in touch before the briefing. Questions? Reply to this email or ${chat.label}: ${chat.href}`,
  ].join("\n");

  return {
    subject: `${data.test ? "[TEST] " : ""}You're on the boat: Palawan Expedition, ${departs}`,
    html,
    text,
  };
}

export function staffEmail(data: BookingEmailData): Email {
  const route = routeOf(data.direction);
  const departs = formatDate(data.departureDate, true);
  const guests = plural(data.guests, "guest");
  const paid = formatPeso(data.paidPhp);
  const ref = reference(data.id);
  const whatsapp = data.whatsapp?.trim() || "Not given";

  const html = shell(
    data,
    `${data.fullName}, ${guests}, ${route.label}, ${departs}`,
    `${hero(
      "New booking",
      "Paid and confirmed. Please get this booked in. Replying to this email goes straight to the guest.",
    )}
    ${detailRows([
      ["Guest", esc(data.fullName)],
      [
        "Email",
        `<a href="mailto:${esc(data.email)}" style="color:${MIDNIGHT}">${esc(data.email)}</a>`,
      ],
      ["WhatsApp", esc(whatsapp)],
      ["Route", esc(route.label)],
      ["Departs", esc(`${departs}, ${route.meet}`)],
      ["Guests", esc(guests)],
      ["Paid", esc(paid)],
      ["Seats left", esc(`${data.seatsLeft} on this departure`)],
      ["Booking ref", esc(ref)],
      ["Stripe payment", esc(data.paymentId ?? "None (100% off code)")],
    ])}`,
  );

  const text = [
    data.test ? "TEST BOOKING: sandbox payment, no real money moved. Please ignore.\n" : "",
    "New booking. Paid and confirmed. Please get this booked in.",
    "",
    `Guest: ${data.fullName}`,
    `Email: ${data.email}`,
    `WhatsApp: ${whatsapp}`,
    `Route: ${route.label}`,
    `Departs: ${departs}, ${route.meet}`,
    `Guests: ${guests}`,
    `Paid: ${paid}`,
    `Seats left: ${data.seatsLeft} on this departure`,
    `Booking ref: ${ref}`,
    `Stripe payment: ${data.paymentId ?? "None (100% off code)"}`,
  ].join("\n");

  return {
    subject: `${data.test ? "[TEST] " : ""}New Palawan booking: ${data.fullName}, ${guests}, ${departs}`,
    html,
    text,
  };
}

async function send(email: Email, to: string[], replyTo: string, idempotencyKey: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serverEnv("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from: serverEnv("BOOKING_EMAIL_FROM") ?? DEFAULT_FROM,
      to,
      reply_to: replyTo,
      ...email,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

// Sends both, so a problem with one still gets the other out. Throws if either
// failed; the idempotency keys stop a retry repeating the one that worked.
export async function sendBookingConfirmation(data: BookingEmailData) {
  const results = await Promise.allSettled([
    send(guestEmail(data), [data.email], GUEST_REPLY_TO, `palawan-guest-${data.id}`),
    send(staffEmail(data), staffEmails(), data.email, `palawan-staff-${data.id}`),
  ]);
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length) {
    throw new Error(failed.map((r) => String(r.reason)).join("; "));
  }
}
