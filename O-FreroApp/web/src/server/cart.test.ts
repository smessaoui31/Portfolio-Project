import { beforeEach, expect, test } from "vitest";
import { prisma } from "@/lib/db";
import { describeLines, loadCart, mergeIntoAccount, saveCart } from "./cart";
import { resetDb } from "./test/db";
import { makeProduct, makeSupplement, makeUser } from "./test/fixtures";

beforeEach(resetDb);

test("mergeIntoAccount merges stored and local carts", async () => {
  const user = await makeUser();
  const marg = await makeProduct({ name: "Margherita" });
  const coke = await makeProduct({ name: "Coca-Cola", categoryId: null, priceCents: 250 });
  await saveCart(user.id, [{ productId: marg.id, quantity: 1, cooking: "NORMAL", supplementIds: [] }]);

  const merged = await mergeIntoAccount(user.id, [
    { productId: marg.id, quantity: 2, cooking: "NORMAL", supplementIds: [] },
    { productId: coke.id, quantity: 1, cooking: "NORMAL", supplementIds: [] },
  ]);

  expect(merged.map((l) => [l.productId, l.quantity])).toEqual([
    [marg.id, 3],
    [coke.id, 1],
  ]);
  expect((await loadCart(user.id)).map((l) => l.quantity)).toEqual([3, 1]);
});

test("loadCart ignores malformed stored data", async () => {
  const user = await makeUser();
  await prisma.cart.create({ data: { userId: user.id, lines: [{ nope: true }, "x"] } });
  expect(await loadCart(user.id)).toEqual([]);
});

test("describeLines adds display data and drops products that no longer exist", async () => {
  const egg = await makeSupplement({ name: "Œuf" });
  const marg = await makeProduct({ name: "Margherita", supplementIds: [egg.id] });
  const items = await describeLines([
    { productId: marg.id, quantity: 2, cooking: "WELL_DONE", supplementIds: [egg.id] },
    { productId: "gone", quantity: 1, cooking: "NORMAL", supplementIds: [] },
  ]);
  expect(items).toEqual([
    { productId: marg.id, quantity: 2, cooking: "WELL_DONE", supplementIds: [egg.id], name: "Margherita", imageUrl: null, supplementNames: ["Œuf"] },
  ]);
});
