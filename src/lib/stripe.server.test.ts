import { describe, expect, it } from "vitest";
import { verifyStripeSignature } from "./stripe.server";

const secret = "whsec_test_secret";
const payload = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });

async function sign(body: string, timestamp: number, key = secret) {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", k, enc.encode(`${timestamp}.${body}`));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

describe("verifyStripeSignature", () => {
  const now = Math.floor(Date.now() / 1000);

  it("accepts a correctly signed payload", async () => {
    const header = `t=${now},v1=${await sign(payload, now)}`;
    expect(await verifyStripeSignature(payload, header, secret)).toBe(true);
  });

  it("accepts when any of several v1 signatures matches (secret rotation)", async () => {
    const header = `t=${now},v1=${"0".repeat(64)},v1=${await sign(payload, now)}`;
    expect(await verifyStripeSignature(payload, header, secret)).toBe(true);
  });

  it("rejects a tampered body", async () => {
    const header = `t=${now},v1=${await sign(payload, now)}`;
    expect(await verifyStripeSignature(payload.replace("evt_1", "evt_2"), header, secret)).toBe(
      false,
    );
  });

  it("rejects the wrong secret", async () => {
    const header = `t=${now},v1=${await sign(payload, now, "whsec_other")}`;
    expect(await verifyStripeSignature(payload, header, secret)).toBe(false);
  });

  it("rejects an old timestamp (replay)", async () => {
    const old = now - 3600;
    const header = `t=${old},v1=${await sign(payload, old)}`;
    expect(await verifyStripeSignature(payload, header, secret)).toBe(false);
  });

  it("rejects a missing or malformed header", async () => {
    expect(await verifyStripeSignature(payload, null, secret)).toBe(false);
    expect(await verifyStripeSignature(payload, "garbage", secret)).toBe(false);
  });
});
