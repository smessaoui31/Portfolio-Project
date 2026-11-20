import { beforeEach, expect, test, vi } from "vitest";
import { prisma } from "@/lib/db";
import { addMatchNight, deleteMatchNight, getBannerMatch, getMatchForOrdering, listMatchNightsAdmin, matchSlotsFor } from "./match-nights";
import { placeOrder } from "./orders";
import { resetDb } from "./test/db";
import { makeHours, makeProduct } from "./test/fixtures";

vi.mock("@/lib/email", () => ({ sendEmail: async () => ({ delivered: false }) }));

// Friday 20 November, 11:00 in Paris: closed until 18:00.
const NOW = new Date("2026-11-20T10:00:00Z");
let pizza = { id: "" };

beforeEach(async () => {
  await resetDb();
  await makeHours();
  pizza = await makeProduct({ name: "Reine", priceCents: 900 });
});

const order = (slotAt: string) => ({
  mode: "PICKUP",
  slotAt,
  paymentMethod: "AT_PICKUP",
  customer: { firstName: "Léa", phone: "0612345678", email: "lea@exemple.fr" },
  lines: [{ productId: pizza.id, quantity: 1, cooking: "NORMAL", supplementIds: [], choices: [] }],
});

// Saturday 21 November, 20:00 in Paris.
const SATURDAY_EVENING = "2026-11-21T19:00:00.000Z";

test("a pickup order for tomorrow's match evening is accepted the day before", async () => {
  await addMatchNight({ date: "2026-11-21", title: "France – Angleterre", message: "Coup d'envoi 21 h" }, NOW);
  const slots = await matchSlotsFor("PICKUP", NOW);
  expect(slots).toMatchObject({ title: "France – Angleterre", day: "2026-11-21" });
  expect(slots!.slots.map((s) => s.toISOString())).toContain(SATURDAY_EVENING);
  expect(await placeOrder(order(SATURDAY_EVENING), { userId: null, now: NOW })).toMatchObject({ ok: true });
});

test("the same slot without a match night is refused", async () => {
  expect(await placeOrder(order(SATURDAY_EVENING), { userId: null, now: NOW })).toMatchObject({ ok: false, error: "INVALID_SLOT" });
});

test("a match two days ahead does not open ordering yet but shows the banner", async () => {
  await addMatchNight({ date: "2026-11-22", title: "France – Angleterre" }, NOW);
  expect(await getMatchForOrdering(NOW)).toBeNull();
  expect(await getBannerMatch(NOW)).toMatchObject({ title: "France – Angleterre", day: "2026-11-22", message: null });
  expect(await getBannerMatch(new Date("2026-11-23T12:00:00Z"))).toBeNull();
});

test("admin adds and deletes match nights, refusing past dates and duplicates", async () => {
  expect(await addMatchNight({ date: "2026-11-01", title: "Trop tard" }, NOW)).toMatchObject({ ok: false });
  expect(await addMatchNight({ date: "2026-11-21", title: "" }, NOW)).toMatchObject({ ok: false });
  expect(await addMatchNight({ date: "2026-11-21", title: "Finale" }, NOW)).toMatchObject({ ok: true });
  expect(await addMatchNight({ date: "2026-11-21", title: "Encore" }, NOW)).toMatchObject({ ok: false });
  const [night] = await listMatchNightsAdmin();
  await deleteMatchNight(night.id);
  expect(await prisma.matchNight.count()).toBe(0);
});
