import Stripe from "stripe";
import { expect, test, vi } from "vitest";

const handled: string[] = [];
vi.mock("@/server/lifecycle", () => ({
  handleStripeEvent: async (e: { type: string }) => {
    handled.push(e.type);
  },
}));

const { POST } = await import("./route");

const payload = JSON.stringify({ id: "evt_1", object: "event", type: "payment_intent.succeeded", data: { object: { id: "pi_1" } } });

const request = (signature: string) =>
  new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": signature, "content-type": "application/json" },
    body: payload,
  });

test("accepts a correctly signed event", async () => {
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET! });
  const res = await POST(request(signature));
  expect(res.status).toBe(200);
  expect(handled).toEqual(["payment_intent.succeeded"]);
});

test("rejects a forged signature", async () => {
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_wrong" });
  const res = await POST(request(signature));
  expect(res.status).toBe(400);
  expect(handled).toHaveLength(1);
});
