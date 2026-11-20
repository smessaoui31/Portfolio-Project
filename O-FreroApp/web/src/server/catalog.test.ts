import { beforeAll, describe, expect, test } from "vitest";
import { prisma } from "@/lib/db";
import { runSeed } from "../../prisma/seed";
import { getCurrentEditionProductId, getHomeData, getMenu, getPricedProducts } from "./catalog";
import { getSlotOptions } from "./settings";
import { resetDb } from "./test/db";

const DURING = new Date("2026-11-20T12:00:00Z");
const BETWEEN = new Date("2027-01-05T12:00:00Z");

beforeAll(async () => {
  await resetDb();
  await runSeed(prisma);
});

describe("getMenu", () => {
  test("shows the current edition and hides it once its edition is over", async () => {
    const names = (await getMenu(DURING)).flatMap((c) => c.products.map((p) => p.name));
    expect(names).toContain("La pizza de mémé");
    expect(names).toContain("Margarita");
    expect((await getMenu(BETWEEN)).flatMap((c) => c.products.map((p) => p.name))).not.toContain("La pizza de mémé");
  });

  test("puts the current edition first in its category", async () => {
    const bestSellers = (await getMenu(DURING)).find((c) => c.name === "Best-sellers")!;
    expect(bestSellers.products[0].name).toBe("La pizza de mémé");
  });

  test("orders categories and exposes sizes and supplements with prices", async () => {
    const menu = await getMenu(DURING);
    expect(menu.map((c) => c.name)).toEqual([
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
    const marg = menu[0].products.find((p) => p.name === "Margarita")!;
    expect(marg).toMatchObject({ unitPriceCents: 900, isPizza: true, isMenu: false, soldOut: false });
    expect(marg.optionSlots.map((s) => [s.label, s.options.map((o) => o.priceCents)])).toEqual([["Taille", [0, 200]]]);
    expect(marg.supplements.find((s) => s.name === "Œuf")).toMatchObject({ priceCents: 150, family: "OTHER" });
    expect(menu.find((c) => c.name === "Menus")!.products.every((p) => p.isMenu)).toBe(true);
  });

  test("hides unavailable products and flags sold out ones", async () => {
    await prisma.product.updateMany({ where: { name: "Reine" }, data: { isAvailable: false } });
    await prisma.product.updateMany({ where: { name: "Napoli" }, data: { stockQuantity: 0 } });
    const pizzas = (await getMenu(DURING))[0].products;
    expect(pizzas.map((p) => p.name)).not.toContain("Reine");
    expect(pizzas.find((p) => p.name === "Napoli")?.soldOut).toBe(true);
    await prisma.product.updateMany({ where: { name: "Reine" }, data: { isAvailable: true } });
    await prisma.product.updateMany({ where: { name: "Napoli" }, data: { stockQuantity: null } });
  });

  test("applies supplement price overrides", async () => {
    const marg = await prisma.product.findFirstOrThrow({ where: { name: "Margarita" } });
    const egg = await prisma.supplement.findUniqueOrThrow({ where: { name: "Œuf" } });
    await prisma.productSupplement.update({
      where: { productId_supplementId: { productId: marg.id, supplementId: egg.id } },
      data: { overridePriceCents: 80 },
    });
    const priced = await getPricedProducts([marg.id]);
    expect(priced.get(marg.id)?.allowedSupplements.find((s) => s.id === egg.id)?.priceCents).toBe(80);
    await prisma.productSupplement.update({
      where: { productId_supplementId: { productId: marg.id, supplementId: egg.id } },
      data: { overridePriceCents: null },
    });
  });
});

describe("getHomeData", () => {
  test("returns edition 1 with the brothers' note and no past edition yet", async () => {
    const h = await getHomeData(DURING);
    expect(h.edition?.number).toBe(1);
    expect(h.edition?.product.name).toBe("La pizza de mémé");
    expect(h.edition?.brothersNote).toContain("AOP");
    expect(h.past).toEqual([]);
    expect(h.preview).toHaveLength(3);
    expect(h.preview.every((p) => p.isPizza)).toBe(true);
  });

  test("falls back to the featured product between editions", async () => {
    const h = await getHomeData(BETWEEN);
    expect(h.edition).toBeNull();
    expect(h.featured?.name).toBe("Margarita");
    const cheezy = await prisma.product.findFirstOrThrow({ where: { name: "Cheezy" } });
    await prisma.settings.update({ where: { id: 1 }, data: { featuredProductId: cheezy.id } });
    expect((await getHomeData(BETWEEN)).featured?.name).toBe("Cheezy");
    await prisma.settings.update({ where: { id: 1 }, data: { featuredProductId: null } });
  });

  test("getCurrentEditionProductId", async () => {
    const meme = await prisma.product.findFirstOrThrow({ where: { name: "La pizza de mémé" } });
    expect(await getCurrentEditionProductId(DURING)).toBe(meme.id);
    expect(await getCurrentEditionProductId(BETWEEN)).toBeNull();
  });
});

test("getSlotOptions uses the lead time of the mode, the delivery cutoff and the stored hours", async () => {
  await prisma.closure.create({ data: { date: "2026-12-25", reason: "Noël" } });
  const pickup = await getSlotOptions("PICKUP", DURING);
  const delivery = await getSlotOptions("DELIVERY", DURING);
  expect(pickup).toMatchObject({ leadMinutes: 15, closures: ["2026-12-25"], lastSlotBeforeCloseMinutes: undefined });
  expect(delivery).toMatchObject({ leadMinutes: 30, lastSlotBeforeCloseMinutes: 30 });
  expect(pickup.hours).toHaveLength(9);
  expect(pickup.now).toBe(DURING);
});
