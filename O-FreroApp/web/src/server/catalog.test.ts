import { beforeAll, describe, expect, test } from "vitest";
import { prisma } from "@/lib/db";
import { runSeed } from "../../prisma/seed";
import { getCurrentEditionProductId, getHomeData, getMenu, getPricedProducts } from "./catalog";
import { getSlotOptions } from "./settings";
import { resetDb } from "./test/db";

const DURING_7 = new Date("2026-11-20T12:00:00Z");
const BETWEEN = new Date("2027-01-05T12:00:00Z");

beforeAll(async () => {
  await resetDb();
  await runSeed(prisma);
});

describe("getMenu", () => {
  test("hides past edition products and shows the current one", async () => {
    const names = (await getMenu(DURING_7)).flatMap((c) => c.products.map((p) => p.name));
    expect(names).toContain("Savoyarde d'hiver");
    expect(names).toContain("Margherita");
    expect(names).not.toContain("BBQ fumée");
  });

  test("orders categories and exposes supplements with prices", async () => {
    const menu = await getMenu(DURING_7);
    expect(menu.map((c) => c.name)).toEqual(["Pizzas", "Desserts", "Boissons"]);
    const marg = menu[0].products.find((p) => p.name === "Margherita")!;
    expect(marg).toMatchObject({ unitPriceCents: 1050, isPizza: true, soldOut: false });
    expect(marg.supplements.map((s) => s.name)).toContain("Œuf");
  });

  test("hides unavailable products and flags sold out ones", async () => {
    await prisma.product.updateMany({ where: { name: "Reine" }, data: { isAvailable: false } });
    await prisma.product.updateMany({ where: { name: "Pepperoni" }, data: { stockQuantity: 0 } });
    const pizzas = (await getMenu(DURING_7))[0].products;
    expect(pizzas.map((p) => p.name)).not.toContain("Reine");
    expect(pizzas.find((p) => p.name === "Pepperoni")?.soldOut).toBe(true);
    await prisma.product.updateMany({ where: { name: "Reine" }, data: { isAvailable: true } });
    await prisma.product.updateMany({ where: { name: "Pepperoni" }, data: { stockQuantity: null } });
  });

  test("applies supplement price overrides", async () => {
    const marg = await prisma.product.findFirstOrThrow({ where: { name: "Margherita" } });
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
  test("returns edition 7 and three past editions", async () => {
    const h = await getHomeData(DURING_7);
    expect(h.edition?.number).toBe(7);
    expect(h.edition?.product.name).toBe("Savoyarde d'hiver");
    expect(h.edition?.brothersNote).toContain("fromage");
    expect(h.past.map((p) => p.number)).toEqual([6, 5, 4]);
    expect(h.preview).toHaveLength(3);
    expect(h.preview.every((p) => p.isPizza)).toBe(true);
  });

  test("falls back to the featured product between editions", async () => {
    const h = await getHomeData(BETWEEN);
    expect(h.edition).toBeNull();
    expect(h.featured?.name).toBe("Margherita");
    const fourCheese = await prisma.product.findFirstOrThrow({ where: { name: "4 Fromages" } });
    await prisma.settings.update({ where: { id: 1 }, data: { featuredProductId: fourCheese.id } });
    expect((await getHomeData(BETWEEN)).featured?.name).toBe("4 Fromages");
    await prisma.settings.update({ where: { id: 1 }, data: { featuredProductId: null } });
  });

  test("getCurrentEditionProductId", async () => {
    const savoyarde = await prisma.product.findFirstOrThrow({ where: { name: "Savoyarde d'hiver" } });
    expect(await getCurrentEditionProductId(DURING_7)).toBe(savoyarde.id);
    expect(await getCurrentEditionProductId(BETWEEN)).toBeNull();
  });
});

test("getSlotOptions uses the lead time of the mode and the stored hours", async () => {
  await prisma.closure.create({ data: { date: "2026-12-25", reason: "Noël" } });
  const pickup = await getSlotOptions("PICKUP", DURING_7);
  const delivery = await getSlotOptions("DELIVERY", DURING_7);
  expect(pickup).toMatchObject({ leadMinutes: 15, closures: ["2026-12-25"] });
  expect(delivery.leadMinutes).toBe(30);
  expect(pickup.hours).toHaveLength(13);
  expect(pickup.now).toBe(DURING_7);
});
