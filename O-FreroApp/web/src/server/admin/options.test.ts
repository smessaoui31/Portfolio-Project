import { beforeEach, expect, test } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "../test/db";
import { attachGroup, makeCategory, makeOptionGroup, makeProduct } from "../test/fixtures";
import { upsertProduct } from "./catalog";
import { deleteOptionGroup, listOptionGroupsAdmin, upsertOptionGroup } from "./options";

beforeEach(resetDb);

const option = (name: string, priceCents = 0) => ({ name, priceCents, isActive: true });

test("saves a group with ordered options and refuses min above max", async () => {
  expect(
    await upsertOptionGroup({ name: "Taille", minSelect: 1, maxSelect: 1, options: [option("Médium 26 cm"), option("Large 33 cm", 200)] }),
  ).toMatchObject({ ok: true });
  const [group] = await listOptionGroupsAdmin();
  expect(group.options.map((o) => [o.name, o.priceCents])).toEqual([
    ["Médium 26 cm", 0],
    ["Large 33 cm", 200],
  ]);
  expect(group.products).toBe(0);
  expect(await upsertOptionGroup({ name: "X", minSelect: 2, maxSelect: 1, options: [option("a")] })).toMatchObject({ ok: false });
  expect(await upsertOptionGroup({ name: "Y", minSelect: 0, maxSelect: 1, options: [] })).toMatchObject({ ok: false });
  expect(await upsertOptionGroup({ name: "Z", minSelect: 1, maxSelect: 1, options: [option("a"), option("a")] })).toMatchObject({ ok: false });
});

test("updating a group keeps option ids, reorders and drops removed options", async () => {
  const saved = await upsertOptionGroup({ name: "Sauce", minSelect: 1, maxSelect: 1, options: [option("Algérienne"), option("Pita"), option("Blanche")] });
  if (!saved.ok) throw new Error(saved.message);
  const before = (await listOptionGroupsAdmin())[0].options;
  const pita = before.find((o) => o.name === "Pita")!;
  await upsertOptionGroup({
    id: saved.id,
    name: "Sauce kebab",
    minSelect: 1,
    maxSelect: 1,
    options: [{ id: pita.id, ...option("Pita") }, option("Samouraï", 50)],
  });
  const after = (await listOptionGroupsAdmin())[0];
  expect(after.name).toBe("Sauce kebab");
  expect(after.options.map((o) => o.name)).toEqual(["Pita", "Samouraï"]);
  expect(after.options[0].id).toBe(pita.id);
});

test("refuses to delete a group still attached", async () => {
  const group = await makeOptionGroup({ name: "Taille" });
  const product = await makeProduct();
  await attachGroup(product.id, group.id);
  expect(await deleteOptionGroup(group.id)).toEqual({ ok: false, message: "Ce groupe est utilisé par 1 produit(s)." });
  await prisma.productOptionGroup.deleteMany();
  expect(await deleteOptionGroup(group.id)).toEqual({ ok: true });
});

test("saving a product keeps existing slot ids", async () => {
  const group = await makeOptionGroup({ name: "Pizza au choix", options: [{ name: "Reine" }] });
  const menu = await makeProduct({ name: "Menu Tribu", categoryId: (await makeCategory({ isMenu: true })).id });
  const slot = await attachGroup(menu.id, group.id, { label: "Pizza 1" });
  const saved = await upsertProduct({
    id: menu.id,
    name: "Menu Tribu",
    priceCents: 2790,
    discountPercent: 0,
    categoryId: menu.categoryId,
    imageUrl: "",
    isAvailable: true,
    stockQuantity: null,
    isEditionOnly: false,
    supplementIds: [],
    optionGroups: [
      { id: slot.id, groupId: group.id, label: "Pizza 1" },
      { groupId: group.id, label: "Pizza 2" },
    ],
  });
  expect(saved).toEqual({ ok: true, id: menu.id });
  const slots = await prisma.productOptionGroup.findMany({ where: { productId: menu.id }, orderBy: { position: "asc" } });
  expect(slots[0].id).toBe(slot.id);
  expect(slots.map((s) => s.label)).toEqual(["Pizza 1", "Pizza 2"]);
});
