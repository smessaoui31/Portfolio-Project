import { beforeEach, describe, expect, test } from "vitest";
import { editionBounds } from "@/domain/editions";
import { prisma } from "@/lib/db";
import { resetDb } from "../test/db";
import { makeCategory, makeEdition, makeOrder, makeProduct, makeUser } from "../test/fixtures";
import {
  addClosure,
  deleteEdition,
  listUsersAdmin,
  saveLoyaltySettings,
  saveServiceWindows,
  setUserRole,
  upsertEdition,
  upsertZone,
} from "./settings";

beforeEach(resetDb);

describe("editions", () => {
  async function editionProduct() {
    const pizzas = (await prisma.category.findUnique({ where: { name: "Pizzas" } })) ?? (await makeCategory({ name: "Pizzas", isPizza: true }));
    return makeProduct({ categoryId: pizzas.id, isEditionOnly: true });
  }

  test("upsertEdition stores Paris bounds", async () => {
    const product = await editionProduct();
    const r = await upsertEdition({ number: 8, productId: product.id, startDate: "2027-01-01", endDate: "2027-02-28", brothersNote: "Pour l'hiver." });
    if (!r.ok) throw new Error(r.message);
    const row = await prisma.edition.findUniqueOrThrow({ where: { id: r.id } });
    expect(row.startsAt.toISOString()).toBe("2026-12-31T23:00:00.000Z");
    expect(row.endsAt.toISOString()).toBe("2027-02-28T23:00:00.000Z");
  });

  test("upsertEdition refuses overlapping periods", async () => {
    const product = await editionProduct();
    await makeEdition({ number: 7, productId: product.id, ...editionBounds("2026-11-01", "2026-12-31") });
    const other = await editionProduct();
    const r = await upsertEdition({ number: 8, productId: other.id, startDate: "2026-12-15", endDate: "2027-02-28", brothersNote: "x" });
    expect(r).toMatchObject({ ok: false });
    if (!r.ok) expect(r.message).toContain("n°07");
  });

  test("upsertEdition refuses a regular product and inverted dates", async () => {
    const regular = await makeProduct({ isEditionOnly: false });
    expect(await upsertEdition({ number: 9, productId: regular.id, startDate: "2027-03-01", endDate: "2027-04-30", brothersNote: "x" })).toMatchObject({ ok: false });
    const product = await editionProduct();
    expect(await upsertEdition({ number: 9, productId: product.id, startDate: "2027-04-30", endDate: "2027-03-01", brothersNote: "x" })).toMatchObject({ ok: false });
  });

  test("deleteEdition refuses an edition already ordered", async () => {
    const product = await editionProduct();
    const edition = await makeEdition({ number: 3, productId: product.id, ...editionBounds("2026-03-01", "2026-04-30") });
    await makeOrder({ editionId: edition.id });
    expect(await deleteEdition(edition.id)).toMatchObject({ ok: false });
  });
});

test("upsertZone normalizes and rejects invalid codes", async () => {
  const ok = await upsertZone({ name: "Centre", postalCodes: "31 000, 31100 31200", feeCents: 250, minOrderCents: 2000, isActive: true });
  if (!ok.ok) throw new Error(ok.message);
  expect((await prisma.deliveryZone.findUniqueOrThrow({ where: { id: ok.id } })).postalCodes).toEqual(["31000", "31100", "31200"]);
  const bad = await upsertZone({ name: "Faux", postalCodes: "31000, 3110", feeCents: 0, minOrderCents: 0, isActive: true });
  expect(bad).toMatchObject({ ok: false });
  if (!bad.ok) expect(bad.message).toContain("3110");
});

test("saveServiceWindows rejects overlaps and bad times, and replaces all windows", async () => {
  expect(
    await saveServiceWindows([
      { weekday: 1, opensAt: "11:30", closesAt: "14:00" },
      { weekday: 1, opensAt: "13:30", closesAt: "15:00" },
    ]),
  ).toMatchObject({ ok: false });
  expect(await saveServiceWindows([{ weekday: 1, opensAt: "18:00", closesAt: "17:00" }])).toMatchObject({ ok: false });
  expect(await saveServiceWindows([{ weekday: 1, opensAt: "25:00", closesAt: "26:00" }])).toMatchObject({ ok: false });
  expect(await saveServiceWindows([{ weekday: 2, opensAt: "18:00", closesAt: "22:00" }])).toEqual({ ok: true });
  expect(await prisma.serviceWindow.count()).toBe(1);
});

test("addClosure validates the date and ignores duplicates", async () => {
  expect(await addClosure("2026-12-25", "Noël")).toEqual({ ok: true });
  expect(await addClosure("2026-12-25")).toEqual({ ok: true });
  expect(await addClosure("25/12/2026")).toMatchObject({ ok: false });
  expect(await prisma.closure.count()).toBe(1);
});

test("saveLoyaltySettings validates ranges", async () => {
  expect(await saveLoyaltySettings({ stampsForReward: 8, featuredProductId: null, pickupLeadMinutes: 20, deliveryLeadMinutes: 40 })).toEqual({ ok: true });
  expect(await prisma.settings.findUniqueOrThrow({ where: { id: 1 } })).toMatchObject({ stampsForReward: 8, pickupLeadMinutes: 20 });
  expect(await saveLoyaltySettings({ stampsForReward: 1, featuredProductId: null, pickupLeadMinutes: 20, deliveryLeadMinutes: 40 })).toMatchObject({ ok: false });
});

describe("users", () => {
  test("setUserRole keeps at least one admin", async () => {
    const admin = await makeUser({ role: "ADMIN" });
    expect(await setUserRole(admin.id, "USER")).toMatchObject({ ok: false });
    const second = await makeUser();
    expect(await setUserRole(second.id, "ADMIN")).toEqual({ ok: true });
    expect(await setUserRole(admin.id, "USER")).toEqual({ ok: true });
  });

  test("listUsersAdmin shows stamp balance and order count", async () => {
    const user = await makeUser({ email: "fidele@exemple.fr", stamps: 7 });
    await makeOrder({ userId: user.id });
    const row = (await listUsersAdmin()).find((u) => u.email === "fidele@exemple.fr");
    expect(row).toMatchObject({ balance: 7, ordersCount: 2 });
  });
});
