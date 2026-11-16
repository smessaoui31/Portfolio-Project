import { expect, test } from "vitest";
import { lineKey, MAX_LINE_QUANTITY, mergeCartLines } from "./cart";
import type { CartLineInput } from "./types";

const l = (productId: string, quantity: number, supplementIds: string[] = [], cooking: CartLineInput["cooking"] = "NORMAL"): CartLineInput => ({
  productId,
  quantity,
  cooking,
  supplementIds,
});

test("lineKey ignores supplement order", () => {
  expect(lineKey(l("marg", 1, ["egg", "ham"]))).toBe(lineKey(l("marg", 3, ["ham", "egg"])));
  expect(lineKey(l("marg", 1, [], "NORMAL"))).not.toBe(lineKey(l("marg", 1, [], "WELL_DONE")));
});

test("mergeCartLines sums equal lines regardless of supplement order and caps at 20", () => {
  const merged = mergeCartLines([l("marg", 15, ["egg", "ham"]), l("coke", 1)], [l("marg", 10, ["ham", "egg"]), l("reine", 2)]);
  expect(MAX_LINE_QUANTITY).toBe(20);
  expect(merged).toEqual([l("marg", 20, ["egg", "ham"]), l("coke", 1), l("reine", 2)]);
});
