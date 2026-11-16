import { beforeAll, expect, test } from "vitest";
import { prisma } from "@/lib/db";
import { runSeed } from "../../prisma/seed";
import { resetDb } from "./test/db";

beforeAll(async () => {
  await resetDb();
  await runSeed(prisma);
});

test("seed creates the menu, hours, zone, editions and an admin", async () => {
  expect(await prisma.category.findFirstOrThrow({ where: { name: "Pizzas" } })).toMatchObject({ isPizza: true });
  expect(await prisma.serviceWindow.count()).toBe(13);
  expect(await prisma.edition.count()).toBe(4);
  const current = await prisma.edition.findUniqueOrThrow({ where: { number: 7 }, include: { product: true } });
  expect(current.product).toMatchObject({ name: "Savoyarde d'hiver", priceCents: 1490, isEditionOnly: true });
  expect(current.startsAt.toISOString()).toBe("2026-10-31T23:00:00.000Z");
  expect(current.endsAt.toISOString()).toBe("2026-12-31T23:00:00.000Z");
  expect(await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } })).toMatchObject({ emailVerified: true });
  expect(await prisma.settings.findUniqueOrThrow({ where: { id: 1 } })).toMatchObject({ stampsForReward: 10 });
  expect(await prisma.deliveryZone.count({ where: { isActive: true } })).toBe(1);
});

test("seed can run twice without duplicating data", async () => {
  await runSeed(prisma);
  expect(await prisma.product.count({ where: { name: "Margherita" } })).toBe(1);
  expect(await prisma.serviceWindow.count()).toBe(13);
  expect(await prisma.user.count({ where: { role: "ADMIN" } })).toBe(1);
});
