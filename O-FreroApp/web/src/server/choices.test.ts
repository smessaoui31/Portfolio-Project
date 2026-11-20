import { beforeEach, expect, test, vi } from "vitest";
import { prisma } from "@/lib/db";
import { reorderLines } from "./account-orders";
import { describeLines } from "./cart";
import { getMenu, getPricedProducts } from "./catalog";
import { placeOrder } from "./orders";
import { resetDb } from "./test/db";
import { attachGroup, makeCategory, makeHours, makeOptionGroup, makeProduct, makeUser, makeZone } from "./test/fixtures";

vi.mock("@/lib/email", () => ({ sendEmail: async () => ({ delivered: false }) }));
vi.mock("@/server/payments", () => ({
  isOnlinePaymentEnabled: () => true,
  createPaymentIntent: async () => ({ intentId: `pi_choices_${Math.random()}`, clientSecret: "cs_test" }),
  cancelPaymentIntent: async () => {},
  retrievePaymentIntentStatus: async () => "requires_payment_method",
}));

const NOW = new Date("2026-11-19T18:02:00Z"); // Thursday 19:02 in Paris

let reine = { id: "" };
let sizeSlot = { id: "" };
let medium = { id: "" };
let large = { id: "" };

beforeEach(async () => {
  await resetDb();
  await makeHours();
  await makeZone({ postalCodes: ["31000"], feeCents: 300, minOrderCents: 1400 });
  const size = await makeOptionGroup({
    name: "Taille",
    options: [
      { name: "Médium 26 cm", priceCents: 0 },
      { name: "Large 33 cm", priceCents: 200 },
    ],
  });
  [medium, large] = size.options;
  reine = await makeProduct({ name: "Reine", priceCents: 900 });
  sizeSlot = await attachGroup(reine.id, size.id);
});

const pickup = (choices: { slotId: string; optionId: string }[], over: Record<string, unknown> = {}) => ({
  mode: "PICKUP",
  slotAt: "2026-11-19T18:30:00Z",
  paymentMethod: "AT_PICKUP",
  customer: { firstName: "Karim", phone: "0612345678", email: "karim@exemple.fr" },
  lines: [{ productId: reine.id, quantity: 1, cooking: "NORMAL", supplementIds: [], choices }],
  ...over,
});

test("stores the chosen size and charges it", async () => {
  const result = await placeOrder(pickup([{ slotId: sizeSlot.id, optionId: large.id }]), { userId: null, now: NOW });
  expect(result).toMatchObject({ ok: true, totalCents: 1100 });
  if (!result.ok) return;
  const item = await prisma.orderItem.findFirstOrThrow({ where: { orderId: result.orderId }, include: { choices: true } });
  expect(item).toMatchObject({ choicesTotalCents: 200, unitPriceCents: 900 });
  expect(item.choices).toEqual([
    expect.objectContaining({ label: "Taille", name: "Large 33 cm", unitPriceCents: 200, slotId: sizeSlot.id, optionId: large.id }),
  ]);
});

test("refuses an order without the required size", async () => {
  expect(await placeOrder(pickup([]), { userId: null, now: NOW })).toMatchObject({
    ok: false,
    error: "OPTIONS_INCOMPLETE",
    message: "Il manque un choix pour Reine.",
  });
});

test("refuses an inactive option", async () => {
  await prisma.optionChoice.update({ where: { id: large.id }, data: { isActive: false } });
  expect(await placeOrder(pickup([{ slotId: sizeSlot.id, optionId: large.id }]), { userId: null, now: NOW })).toMatchObject({
    ok: false,
    error: "OPTION_NOT_ALLOWED",
    message: "Un choix n'est pas proposé pour Reine.",
  });
});

test("refuses the free pizza in delivery", async () => {
  const user = await makeUser({ stamps: 10 });
  const input = pickup([{ slotId: sizeSlot.id, optionId: medium.id }], {
    mode: "DELIVERY",
    slotAt: "2026-11-19T18:45:00Z",
    paymentMethod: "ONLINE",
    address: { line1: "12 rue des Lois", postalCode: "31000", city: "Toulouse" },
    rewardLineIndex: 0,
  });
  expect(await placeOrder(input, { userId: user.id, now: NOW })).toMatchObject({
    ok: false,
    error: "REWARD_PICKUP_ONLY",
    message: "La pizza offerte est réservée aux commandes à emporter.",
  });
});

test("the menu exposes slots with labels and active options only; priced products know menus", async () => {
  const pizzas = await makeOptionGroup({
    name: "Pizza au choix",
    options: [{ name: "Reine" }, { name: "Duchesse", priceCents: 300, isActive: false }],
  });
  const menu = await makeProduct({ name: "Menu Tribu", priceCents: 2790, categoryId: (await makeCategory({ name: "Menus", isMenu: true })).id });
  await attachGroup(menu.id, pizzas.id, { label: "Pizza 1", position: 0 });
  await attachGroup(menu.id, pizzas.id, { label: "Pizza 2", position: 1 });

  const menuProduct = (await getMenu(NOW)).flatMap((c) => c.products).find((p) => p.id === menu.id)!;
  expect(menuProduct.isMenu).toBe(true);
  expect(menuProduct.optionSlots.map((s) => s.label)).toEqual(["Pizza 1", "Pizza 2"]);
  expect(menuProduct.optionSlots[0].options.map((o) => o.name)).toEqual(["Reine"]);
  const priced = (await getPricedProducts([menu.id, reine.id])).get(reine.id)!;
  expect(priced.optionSlots[0]).toMatchObject({ label: "Taille", minSelect: 1, maxSelect: 1 });
});

test("describeLines names the choices", async () => {
  const [line] = await describeLines([
    { productId: reine.id, quantity: 1, cooking: "NORMAL", supplementIds: [], choices: [{ slotId: sizeSlot.id, optionId: large.id }] },
  ]);
  expect(line.choiceNames).toEqual(["Taille : Large 33 cm"]);
});

test("reorder keeps valid choices and skips a line whose option was deactivated", async () => {
  const user = await makeUser();
  const placed = await placeOrder(pickup([{ slotId: sizeSlot.id, optionId: large.id }]), { userId: user.id, now: NOW });
  if (!placed.ok) throw new Error(placed.message);

  const again = await reorderLines(user.id, placed.orderId, NOW);
  expect(again?.lines[0]).toMatchObject({ choices: [{ slotId: sizeSlot.id, optionId: large.id }], choiceNames: ["Taille : Large 33 cm"] });

  await prisma.optionChoice.update({ where: { id: large.id }, data: { isActive: false } });
  expect(await reorderLines(user.id, placed.orderId, NOW)).toEqual({ lines: [], skipped: ["Reine"] });
});
