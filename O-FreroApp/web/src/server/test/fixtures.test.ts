import { beforeAll, expect, test } from "vitest";
import { COOKING_LABELS } from "@/domain/types";
import { prisma } from "@/lib/db";
import { resetDb } from "./db";
import { attachGroup, makeCategory, makeOptionGroup, makeProduct } from "./fixtures";

beforeAll(async () => {
  await resetDb();
});

test("an option group attaches twice to one product with labels", async () => {
  const group = await makeOptionGroup({ name: "Pizza au choix", options: [{ name: "Reine" }, { name: "Duchesse", priceCents: 300 }] });
  const product = await makeProduct({ categoryId: (await makeCategory({ isMenu: true })).id });
  await attachGroup(product.id, group.id, { label: "Pizza 1", position: 0 });
  await attachGroup(product.id, group.id, { label: "Pizza 2", position: 1 });
  const slots = await prisma.productOptionGroup.findMany({ where: { productId: product.id }, orderBy: { position: "asc" } });
  expect(slots.map((s) => s.label)).toEqual(["Pizza 1", "Pizza 2"]);
  expect(group.options.map((o) => [o.name, o.priceCents])).toEqual([
    ["Reine", 0],
    ["Duchesse", 300],
  ]);
});

test("cooking keeps the renamed value", () => {
  expect(Object.keys(COOKING_LABELS)).toEqual(["WELL_DONE", "NORMAL", "LIGHTLY_COOKED"]);
  expect(COOKING_LABELS.LIGHTLY_COOKED).toBe("Pas trop cuite");
});
