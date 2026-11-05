import { afterEach, describe, expect, it, vi } from "vitest";
import {
  guestEmail,
  sendBookingConfirmation,
  staffEmail,
  staffEmails,
  type BookingEmailData,
} from "./booking-email.server";

const booking: BookingEmailData = {
  id: "7d49cc9d-f628-46d2-8802-9ba77b76ced1",
  fullName: "Jo Traveller",
  email: "jo@example.com",
  whatsapp: "+63 900 000 0000",
  direction: "elnido-coron",
  departureDate: "2026-12-28",
  guests: 2,
  paidPhp: 38000,
  seatsLeft: 18,
  paymentId: "pi_123",
  test: false,
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("guestEmail", () => {
  it("gives the guest their trip details", () => {
    const { subject, html, text } = guestEmail(booking);
    expect(subject).toBe("You're on the boat: Palawan Expedition, Mon 28 Dec 2026");
    for (const body of [html, text]) {
      expect(body).toContain("El Nido → Coron");
      expect(body).toContain("Mon 28 Dec 2026, Mad Monkey Nacpan Beach, 8AM");
      expect(body).toContain("₱38,000");
      expect(body).toContain("7D49CC9D");
      expect(body).toContain("6PM the night before at Mad Monkey Nacpan Beach");
    }
    expect(html).toContain("Hi Jo,");
  });

  it("uses the other route's briefing and works out the night before across a year", () => {
    const { text } = guestEmail({
      ...booking,
      direction: "coron-elnido",
      departureDate: "2027-01-01",
    });
    expect(text).toContain("Tribu Kuridas Bar");
    expect(text).toContain("Thu 31 Dec");
  });
});

describe("staffEmail", () => {
  it("gives staff what they need to book it in", () => {
    const { subject, text } = staffEmail(booking);
    expect(subject).toBe("New Palawan booking: Jo Traveller, 2 guests, Mon 28 Dec 2026");
    expect(text).toContain("jo@example.com");
    expect(text).toContain("+63 900 000 0000");
    expect(text).toContain("18 on this departure");
    expect(text).toContain("pi_123");
  });

  it("copes with no WhatsApp and a 100% off code", () => {
    const { text } = staffEmail({ ...booking, whatsapp: "", paymentId: null, paidPhp: 0 });
    expect(text).toContain("WhatsApp: Not given");
    expect(text).toContain("None (100% off code)");
    expect(text).toContain("₱0");
  });
});

describe("both emails", () => {
  const emails = [guestEmail, staffEmail];

  it("escapes what the guest typed", () => {
    const attack = "<script>alert(1)</script>";
    for (const email of emails) {
      const { html } = email({ ...booking, fullName: attack, whatsapp: attack });
      expect(html).not.toContain("<script>");
      expect(html).toContain("&lt;script&gt;");
    }
  });

  it("marks a sandbox booking as a test, and only then", () => {
    for (const email of emails) {
      expect(email(booking).subject).not.toContain("[TEST]");
      expect(email(booking).html).not.toContain("TEST BOOKING");
      const test = email({ ...booking, test: true });
      expect(test.subject.startsWith("[TEST] ")).toBe(true);
      expect(test.html).toContain("TEST BOOKING");
      expect(test.text).toContain("TEST BOOKING");
    }
  });

  it("has no em dashes", () => {
    for (const email of emails) {
      const { subject, html, text } = email(booking);
      expect(subject + html + text).not.toContain("—");
    }
  });

  it("keeps to the site's brand", () => {
    const palette = [
      "#132441",
      "#DAF561",
      "#87BBD7",
      "#FAF6F1",
      "#FDFBF9",
      "#4A5670",
      "#DCDDDF",
      "#6A95B2",
    ];
    for (const email of emails) {
      const { html } = email({ ...booking, test: true });
      for (const colour of html.match(/#[0-9a-f]{3,8}\b/gi) ?? []) {
        expect(palette).toContain(colour);
      }
      expect(html).toContain("family=Barlow+Condensed");
      expect(html).toContain("Palawan Expedition</div>");
    }
  });
});

describe("staffEmails", () => {
  it("falls back to customer service", () => {
    vi.stubEnv("BOOKING_STAFF_EMAILS", "");
    expect(staffEmails()).toEqual(["cs@madmonkeyhostels.com"]);
  });

  it("reads a comma-separated list", () => {
    vi.stubEnv("BOOKING_STAFF_EMAILS", " one@example.com, two@example.com ,");
    expect(staffEmails()).toEqual(["one@example.com", "two@example.com"]);
  });
});

describe("sendBookingConfirmation", () => {
  function stubResend(failFor?: string) {
    const sent: { to: string[]; replyTo: string; key: string | null }[] = [];
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("BOOKING_STAFF_EMAILS", "staff@example.com");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        const body = JSON.parse(String(init.body)) as { to: string[]; reply_to: string };
        const key = new Headers(init.headers).get("Idempotency-Key");
        if (body.to.includes(failFor ?? "")) return new Response("nope", { status: 500 });
        sent.push({ to: body.to, replyTo: body.reply_to, key });
        return new Response("{}", { status: 200 });
      }),
    );
    return sent;
  }

  it("emails the guest and staff, with staff replies going to the guest", async () => {
    const sent = stubResend();
    await sendBookingConfirmation(booking);
    expect(sent).toEqual([
      {
        to: ["jo@example.com"],
        replyTo: "cs@madmonkeyhostels.com",
        key: `palawan-guest-${booking.id}`,
      },
      {
        to: ["staff@example.com"],
        replyTo: "jo@example.com",
        key: `palawan-staff-${booking.id}`,
      },
    ]);
  });

  it("still tells staff when the guest email fails, then reports the failure", async () => {
    const sent = stubResend("jo@example.com");
    await expect(sendBookingConfirmation(booking)).rejects.toThrow("Resend 500");
    expect(sent.map((s) => s.to)).toEqual([["staff@example.com"]]);
  });
});
