import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { prisma } from "@/lib/db";
import { runSeed } from "../../prisma/seed";
import { placeOrder } from "./orders";
import { createPaymentIntent } from "./payments";
import { resetDb } from "./test/db";
import { makeUser } from "./test/fixtures";

const sent: { to: string; subject: string; text: string }[] = [];
vi.mock("@/lib/email", () => ({
  sendEmail: async (msg: { to: string; subject: string; text: string }) => {
    sent.push(msg);
    return { delivered: false };
  },
}));
vi.mock("@/server/payments", () => ({
  isOnlinePaymentEnabled: () => true,
  createPaymentIntent: vi.fn(async () => ({ intentId: `pi_test_${Math.random()}`, clientSecret: "cs_test" })),
  cancelPaymentIntent: async () => {},
  retrievePaymentIntentStatus: async () => "requires_payment_method",
}));

const NOW = new Date("2026-11-19T18:02:00Z"); // Thursday 19:02 in Paris
const ctx = { userId: null as string | null, now: NOW };
let MARG = "";
let EGG = "";
let NOT_LINKED = "";
let SAVOYARDE = "";
let MEDIUM: { slotId: string; optionId: string }[] = [];
let MEME_MEDIUM: { slotId: string; optionId: string }[] = [];

/** The Médium size choice of a seeded pizza (every seeded pizza has a required size). */
async function medium(productId: string) {
  const slot = await prisma.productOptionGroup.findFirstOrThrow({ where: { productId, group: { name: "Taille" } }, include: { group: { include: { options: true } } } });
  return [{ slotId: slot.id, optionId: slot.group.options.find((o) => o.name === "Médium 26 cm")!.id }];
}


beforeAll(async () => {
  await resetDb();
  await runSeed(prisma);
  MARG = (await prisma.product.findFirstOrThrow({ where: { name: "Margarita" } })).id;
  SAVOYARDE = (await prisma.product.findFirstOrThrow({ where: { name: "La pizza de mémé" } })).id;
  MEDIUM = await medium(MARG);
  MEME_MEDIUM = await medium(SAVOYARDE);
  EGG = (await prisma.supplement.findUniqueOrThrow({ where: { name: "Œuf" } })).id;
  NOT_LINKED = (await prisma.supplement.create({ data: { name: "Truffe", priceCents: 500 } })).id;
});

beforeEach(async () => {
  sent.length = 0;
  await prisma.product.update({ where: { id: MARG }, data: { stockQuantity: null } });
});

const validPickup = (over: Record<string, unknown> = {}) => ({
  mode: "PICKUP",
  slotAt: "2026-11-19T18:30:00Z",
  paymentMethod: "AT_PICKUP",
  customer: { firstName: "Karim", phone: "06 12 34 56 78", email: "Karim@Exemple.fr" },
  lines: [{ productId: MARG, quantity: 2, cooking: "NORMAL", supplementIds: [EGG], choices: MEDIUM }],
  ...over,
});

const validDelivery = (over: Record<string, unknown> = {}) => ({
  ...validPickup(),
  mode: "DELIVERY",
  slotAt: "2026-11-19T18:45:00Z",
  paymentMethod: "ONLINE",
  address: { line1: "12 rue des Lois", postalCode: "31 000", city: "Toulouse" },
  ...over,
});

test("guest pickup paid at pickup is RECEIVED with no client secret and a confirmation e-mail", async () => {
  const r = await placeOrder(validPickup(), ctx);
  expect(r).toMatchObject({ ok: true, clientSecret: null, totalCents: 2100 });
  if (!r.ok) return;
  const o = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId }, include: { items: { include: { supplements: true } }, logs: true } });
  expect(o).toMatchObject({
    status: "RECEIVED",
    userId: null,
    customerEmail: "karim@exemple.fr",
    customerPhone: "0612345678",
    subtotalCents: 2100,
    totalCents: 2100,
    mode: "PICKUP",
    paymentMethod: "AT_PICKUP",
  });
  expect(o.items[0]).toMatchObject({ name: "Margarita", quantity: 2, unitPriceCents: 900, supplementsTotalCents: 300, isPizza: true });
  expect(o.items[0].supplements.map((s) => s.name)).toEqual(["Œuf"]);
  expect(o.logs.map((l) => l.status)).toEqual(["RECEIVED"]);
  expect(o.trackingToken.length).toBeGreaterThanOrEqual(32);
  expect(o.confirmationSentAt).not.toBeNull();
  expect(sent).toHaveLength(1);
  expect(sent[0].to).toBe("karim@exemple.fr");
  expect(sent[0].text).toContain(`/suivi/${o.trackingToken}`);
});

test("guest delivery online creates PENDING_PAYMENT with fee and client secret", async () => {
  const r = await placeOrder(validDelivery(), ctx);
  expect(r).toMatchObject({ ok: true, clientSecret: "cs_test" });
  if (!r.ok) return;
  const o = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } });
  expect(o).toMatchObject({ status: "PENDING_PAYMENT", deliveryFeeCents: 300, totalCents: 2400, postalCode: "31000", city: "Toulouse" });
  expect(o.stripePaymentIntentId).toMatch(/^pi_test_/);
  expect(o.confirmationSentAt).toBeNull();
  expect(sent).toHaveLength(0);
});

test("an order containing the current edition records the edition", async () => {
  const r = await placeOrder(validPickup({ lines: [{ productId: SAVOYARDE, quantity: 1, cooking: "NORMAL", supplementIds: [], choices: MEME_MEDIUM }] }), ctx);
  if (!r.ok) throw new Error(r.message);
  const o = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId }, include: { edition: true } });
  expect(o.edition?.number).toBe(1);
});

describe("rejections create nothing", () => {
  test.each([
    ["delivery paid at pickup", () => validDelivery({ paymentMethod: "AT_PICKUP" }), "DELIVERY_REQUIRES_ONLINE"],
    ["delivery without address", () => validDelivery({ address: undefined }), "ADDRESS_REQUIRED"],
    ["slot too early", () => validPickup({ slotAt: "2026-11-19T18:15:00Z" }), "INVALID_SLOT"],
    ["slot in a later service", () => validPickup({ slotAt: "2026-11-20T17:00:00Z" }), "INVALID_SLOT"],
    ["out of zone", () => validDelivery({ address: { line1: "1 rue", postalCode: "75001", city: "Paris" } }), "OUT_OF_ZONE"],
    ["below minimum", () => validDelivery({ lines: [{ productId: MARG, quantity: 1, cooking: "NORMAL", supplementIds: [], choices: MEDIUM }] }), "BELOW_MINIMUM"],
    ["tampered supplement", () => validPickup({ lines: [{ productId: MARG, quantity: 1, cooking: "NORMAL", supplementIds: [NOT_LINKED], choices: MEDIUM }] }), "SUPPLEMENT_NOT_ALLOWED"],
    ["quantity 99", () => validPickup({ lines: [{ productId: MARG, quantity: 99, cooking: "NORMAL", supplementIds: [], choices: MEDIUM }] }), "INVALID_QUANTITY"],
    ["reward as guest", () => validPickup({ rewardLineIndex: 0 }), "REWARD_UNAVAILABLE"],
    ["bad phone", () => validPickup({ customer: { firstName: "K", phone: "123", email: "k@exemple.fr" } }), "VALIDATION"],
  ] as const)("%s", async (_name, input, error) => {
    const before = await prisma.order.count();
    const r = await placeOrder(input(), ctx);
    expect(r).toMatchObject({ ok: false, error });
    if (!r.ok) expect(r.message.length).toBeGreaterThan(5);
    expect(await prisma.order.count()).toBe(before);
  });

  test("below minimum message gives the amount", async () => {
    const r = await placeOrder(validDelivery({ lines: [{ productId: MARG, quantity: 1, cooking: "NORMAL", supplementIds: [], choices: MEDIUM }] }), ctx);
    expect(r.ok ? "" : r.message).toContain("14,00");
  });
});

test("account with 10 stamps redeems a pizza and decrements stock", async () => {
  const user = await makeUser({ email: "fidele@exemple.fr", stamps: 10 });
  await prisma.product.update({ where: { id: MARG }, data: { stockQuantity: 5 } });
  const r = await placeOrder(
    validPickup({ lines: [{ productId: MARG, quantity: 1, cooking: "NORMAL", supplementIds: [], choices: MEDIUM }], rewardLineIndex: 0 }),
    { userId: user.id, now: NOW },
  );
  if (!r.ok) throw new Error(r.message);
  const o = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId }, include: { items: true } });
  expect(o).toMatchObject({ userId: user.id, rewardCents: 900, totalCents: 0 });
  expect(o.items[0].isReward).toBe(true);
  expect(await prisma.loyaltyEntry.findFirst({ where: { orderId: o.id, kind: "REDEEM" } })).toMatchObject({ stamps: 10 });
  expect((await prisma.product.findUniqueOrThrow({ where: { id: MARG } })).stockQuantity).toBe(4);

  const again = await placeOrder(
    validPickup({ lines: [{ productId: MARG, quantity: 1, cooking: "NORMAL", supplementIds: [], choices: MEDIUM }], rewardLineIndex: 0 }),
    { userId: user.id, now: NOW },
  );
  expect(again).toMatchObject({ ok: false, error: "REWARD_UNAVAILABLE" });
});

test("stock is never oversold", async () => {
  await prisma.product.update({ where: { id: MARG }, data: { stockQuantity: 1 } });
  const r = await placeOrder(validPickup({ lines: [{ productId: MARG, quantity: 2, cooking: "NORMAL", supplementIds: [], choices: MEDIUM }] }), ctx);
  expect(r).toMatchObject({ ok: false, error: "OUT_OF_STOCK" });
  expect((await prisma.product.findUniqueOrThrow({ where: { id: MARG } })).stockQuantity).toBe(1);
});

test("edition product after its end is refused", async () => {
  const later = new Date("2027-01-05T18:02:00Z");
  const r = await placeOrder(
    validPickup({ slotAt: "2027-01-05T18:30:00Z", lines: [{ productId: SAVOYARDE, quantity: 1, cooking: "NORMAL", supplementIds: [], choices: MEME_MEDIUM }] }),
    { userId: null, now: later },
  );
  expect(r).toMatchObject({ ok: false, error: "EDITION_OVER" });
  if (!r.ok) expect(r.message).toContain("La pizza de mémé");
});

test("a Stripe failure cancels the order and gives back stock and reward", async () => {
  const user = await makeUser({ email: "malchance@exemple.fr", stamps: 10 });
  await prisma.product.update({ where: { id: MARG }, data: { stockQuantity: 5 } });
  vi.mocked(createPaymentIntent).mockRejectedValueOnce(new Error("stripe down"));
  vi.spyOn(console, "error").mockImplementationOnce(() => {});
  const r = await placeOrder(
    validPickup({ paymentMethod: "ONLINE", lines: [{ productId: MARG, quantity: 3, cooking: "NORMAL", supplementIds: [], choices: MEDIUM }], rewardLineIndex: 0 }),
    { userId: user.id, now: NOW },
  );
  expect(r).toMatchObject({ ok: false, error: "PAYMENT_UNAVAILABLE" });
  const o = await prisma.order.findFirstOrThrow({ where: { userId: user.id, mode: "PICKUP", paymentMethod: "ONLINE" } });
  expect(o.status).toBe("CANCELLED");
  expect((await prisma.product.findUniqueOrThrow({ where: { id: MARG } })).stockQuantity).toBe(5);
  expect(await prisma.loyaltyEntry.count({ where: { orderId: o.id, kind: "REDEEM" } })).toBe(0);
});

describe("slot at submit time", () => {
  test("ASAP is resolved by the server to the current first slot", async () => {
    const later = new Date("2026-11-19T18:20:00Z"); // 19:20 Paris: first slot is now 19:45
    const r = await placeOrder(validPickup({ slotAt: "asap" }), { userId: null, now: later });
    if (!r.ok) throw new Error(r.message);
    const o = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } });
    expect(o.slotAt.toISOString()).toBe("2026-11-19T18:45:00.000Z");
  });

  test("a chosen time that no longer leaves 15 minutes is refused (the client's rule)", async () => {
    const r = await placeOrder(validPickup({ slotAt: "2026-11-19T18:30:00Z" }), { userId: null, now: new Date("2026-11-19T18:17:00Z") });
    expect(r).toMatchObject({ ok: false, error: "INVALID_SLOT" });
  });
});

describe("very small totals", () => {
  test("a free order chosen as online payment needs no payment at all", async () => {
    const user = await makeUser({ email: "gratuit@exemple.fr", stamps: 10 });
    vi.mocked(createPaymentIntent).mockClear();
    const r = await placeOrder(
      validPickup({ paymentMethod: "ONLINE", lines: [{ productId: MARG, quantity: 1, cooking: "NORMAL", supplementIds: [], choices: MEDIUM }], rewardLineIndex: 0 }),
      { userId: user.id, now: NOW },
    );
    expect(r).toMatchObject({ ok: true, clientSecret: null, totalCents: 0 });
    expect(createPaymentIntent).not.toHaveBeenCalled();
    if (r.ok) expect((await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } })).status).toBe("RECEIVED");
  });

  test("online payment under 0,50 € is refused with a clear message", async () => {
    const user = await makeUser({ email: "centimes@exemple.fr", stamps: 10 });
    const oregano = await prisma.supplement.create({ data: { name: "Origan", priceCents: 30 } });
    await prisma.productSupplement.create({ data: { productId: MARG, supplementId: oregano.id } });
    const r = await placeOrder(
      validPickup({ paymentMethod: "ONLINE", lines: [{ productId: MARG, quantity: 1, cooking: "NORMAL", supplementIds: [oregano.id], choices: MEDIUM }], rewardLineIndex: 0 }),
      { userId: user.id, now: NOW },
    );
    expect(r).toMatchObject({ ok: false, error: "ONLINE_MINIMUM" });
    if (!r.ok) expect(r.message).toContain("0,50");
  });
});
