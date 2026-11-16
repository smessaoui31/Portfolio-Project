import { beforeEach, expect, test } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "../test/db";
import { makeCategory, makeOrder, makeProduct, makeSupplement } from "../test/fixtures";
import { deleteCategory, deleteProduct, reorderCategories, upsertCategory, upsertProduct } from "./catalog";

beforeEach(resetDb);

test("upsertProduct creates then updates a product and syncs its supplements", async () => {
  const cat = await makeCategory({ name: "Pizzas", isPizza: true });
  const egg = await makeSupplement({ name: "Œuf" });
  const ham = await makeSupplement({ name: "Jambon" });
  const created = await upsertProduct({
    name: "Calzone",
    description: "Chausson",
    priceCents: 1300,
    discountPercent: 0,
    categoryId: cat.id,
    imageUrl: "/images/pizzas/reine.jpg",
    isAvailable: true,
    stockQuantity: null,
    isEditionOnly: false,
    supplementIds: [egg.id, ham.id],
  });
  if (!created.ok) throw new Error(created.message);
  const updated = await upsertProduct({
    id: created.id,
    name: "Calzone",
    priceCents: 1350,
    discountPercent: 10,
    categoryId: cat.id,
    imageUrl: "",
    isAvailable: false,
    stockQuantity: 5,
    isEditionOnly: false,
    supplementIds: [ham.id],
  });
  expect(updated).toEqual({ ok: true, id: created.id });
  const row = await prisma.product.findUniqueOrThrow({ where: { id: created.id }, include: { supplements: true } });
  expect(row).toMatchObject({ priceCents: 1350, discountPercent: 10, imageUrl: null, isAvailable: false, stockQuantity: 5 });
  expect(row.supplements.map((s) => s.supplementId)).toEqual([ham.id]);
});

test("upsertProduct rejects bad input with a message", async () => {
  const base = { name: "X", priceCents: 1000, discountPercent: 0, categoryId: null, imageUrl: "", isAvailable: true, stockQuantity: null, isEditionOnly: false, supplementIds: [] };
  expect(await upsertProduct({ ...base, discountPercent: 95 })).toMatchObject({ ok: false });
  expect(await upsertProduct({ ...base, imageUrl: "javascript:alert(1)" })).toMatchObject({ ok: false });
  expect(await upsertProduct({ ...base, imageUrl: "https://exemple.fr/pizza.jpg" })).toMatchObject({ ok: false });
  expect(await upsertProduct({ ...base, name: "" })).toMatchObject({ ok: false });
});

test("deleteProduct refuses an ordered product", async () => {
  const product = await makeProduct();
  await makeOrder({ productId: product.id });
  expect(await deleteProduct(product.id)).toEqual({ ok: false, message: "Produit déjà commandé, rends-le indisponible." });
  const unused = await makeProduct();
  expect(await deleteProduct(unused.id)).toEqual({ ok: true });
});

test("categories: create, reorder, and refuse deleting a category with products", async () => {
  const a = await upsertCategory({ name: "Pizzas", isPizza: true });
  const b = await upsertCategory({ name: "Desserts", isPizza: false });
  if (!a.ok || !b.ok) throw new Error();
  await reorderCategories([b.id, a.id]);
  const order = await prisma.category.findMany({ orderBy: { displayOrder: "asc" } });
  expect(order.map((c) => c.name)).toEqual(["Desserts", "Pizzas"]);
  await makeProduct({ categoryId: a.id });
  expect(await deleteCategory(a.id)).toMatchObject({ ok: false });
  expect(await deleteCategory(b.id)).toEqual({ ok: true });
  expect(await upsertCategory({ name: "Pizzas", isPizza: false })).toMatchObject({ ok: false, message: "Cette catégorie existe déjà." });
});
