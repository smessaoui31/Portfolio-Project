import { beforeAll, expect, test } from "vitest";
import { prisma } from "@/lib/db";
import { runSeed } from "../../prisma/seed";
import { resetDb } from "./test/db";

beforeAll(async () => {
  await resetDb();
  await runSeed(prisma);
});

test("seed loads the real menu", async () => {
  expect((await prisma.category.findMany({ orderBy: { displayOrder: "asc" } })).map((c) => c.name)).toEqual([
    "Collectors",
    "Best-sellers",
    "Prestiges",
    "Calzones",
    "Pizzaninis",
    "Menus",
    "Tex-mex",
    "Desserts",
    "Boissons",
  ]);
  expect(await prisma.category.findFirstOrThrow({ where: { name: "Menus" } })).toMatchObject({ isMenu: true, isPizza: false });
  expect(await prisma.category.findFirstOrThrow({ where: { name: "Pizzaninis" } })).toMatchObject({ isPizza: true });
  expect(await prisma.product.count({ where: { isEditionOnly: false } })).toBe(47);
  expect(await prisma.product.findFirstOrThrow({ where: { name: "Reine" } })).toMatchObject({ priceCents: 900, imageUrl: null });
  expect(await prisma.product.findFirstOrThrow({ where: { name: "Menu Maxi" } })).toMatchObject({ priceCents: 3890 });
  expect(await prisma.serviceWindow.count()).toBe(9);
  expect(await prisma.deliveryZone.findFirstOrThrow()).toMatchObject({
    postalCodes: ["31000", "31100", "31300", "31400"],
    feeCents: 300,
    minOrderCents: 1400,
  });
  const edition = await prisma.edition.findFirstOrThrow({ include: { product: true } });
  expect(await prisma.edition.count()).toBe(1);
  expect(edition).toMatchObject({
    number: 1,
    brothersNote: "Quatre fromages AOP, fraîchement sélectionnés et testés par nous pendant un mois.",
  });
  expect(edition.startsAt.toISOString()).toBe("2026-10-31T23:00:00.000Z");
  expect(edition.endsAt.toISOString()).toBe("2026-12-31T23:00:00.000Z");
  expect(edition.product).toMatchObject({ name: "La pizza de mémé", priceCents: 1000, isEditionOnly: true });
  const maxi = await prisma.productOptionGroup.findMany({
    where: { product: { name: "Menu Maxi" } },
    orderBy: { position: "asc" },
    include: { group: true },
  });
  expect(maxi.map((s) => s.label ?? s.group.name)).toEqual(["Pizza 1", "Pizza 2", "Pizza 3", "Cuisson", "Bouteille du menu"]);
  const choice = await prisma.optionGroup.findUniqueOrThrow({ where: { name: "Pizza au choix" }, include: { options: { orderBy: { displayOrder: "asc" } } } });
  expect(choice.options).toHaveLength(26);
  expect(choice.options[0]).toMatchObject({ name: "Pizza du moment", priceCents: 100 });
  expect(choice.options.find((o) => o.name === "Duchesse")).toMatchObject({ priceCents: 300 });
  expect(choice.options.find((o) => o.name === "Reine")).toMatchObject({ priceCents: 0 });
  expect(await prisma.supplement.count()).toBe(31);
  expect(await prisma.supplement.findUniqueOrThrow({ where: { name: "Magret de canard" } })).toMatchObject({ priceCents: 290, family: "MEAT" });
  const reine = await prisma.product.findFirstOrThrow({ where: { name: "Reine" }, include: { supplements: true, optionGroups: { include: { group: true } } } });
  expect(reine.supplements).toHaveLength(31);
  expect(reine.optionGroups.map((s) => s.group.name)).toEqual(["Taille"]);
  expect(await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } })).toMatchObject({ emailVerified: true });
  expect(await prisma.settings.findUniqueOrThrow({ where: { id: 1 } })).toMatchObject({ stampsForReward: 10, deliveryCutoffMinutes: 30 });
});

test("seed can run twice without duplicating data", async () => {
  await runSeed(prisma);
  expect(await prisma.product.count({ where: { name: "Reine" } })).toBe(1);
  expect(await prisma.optionGroup.count({ where: { name: "Taille" } })).toBe(1);
  expect(await prisma.productOptionGroup.count({ where: { product: { name: "Menu Maxi" } } })).toBe(5);
  expect(await prisma.serviceWindow.count()).toBe(9);
  expect(await prisma.user.count({ where: { role: "ADMIN" } })).toBe(1);
});
