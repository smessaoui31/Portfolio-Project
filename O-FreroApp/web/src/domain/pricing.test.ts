import { describe, expect, test } from "vitest";
import { CartError, orderTotalCents, priceCart, unitPriceCents, type PricedProduct } from "./pricing";
import type { LineChoice, OptionSlot } from "./options";
import type { CartLineInput } from "./types";

const base = { discountPercent: 0, isAvailable: true, stockQuantity: null, isEditionOnly: false, isMenu: false, optionSlots: [] };
const size: OptionSlot = {
  id: "s1",
  label: "Taille",
  minSelect: 1,
  maxSelect: 1,
  options: [
    { id: "m", name: "Médium 26 cm", priceCents: 0 },
    { id: "l", name: "Large 33 cm", priceCents: 200 },
  ],
};
const chevre = { id: "chevre", name: "Chèvre", priceCents: 150 };
const egg = { id: "egg", name: "Œuf", priceCents: 100 };
const PRODUCTS = new Map<string, PricedProduct>([
  ["marg", { ...base, id: "marg", name: "Margherita", priceCents: 1050, isPizza: true, allowedSupplements: [egg] }],
  ["coke", { ...base, id: "coke", name: "Coca-Cola", priceCents: 250, isPizza: false, allowedSupplements: [] }],
  ["old-edition", { ...base, id: "old-edition", name: "BBQ fumée", priceCents: 1390, isPizza: true, isEditionOnly: true, allowedSupplements: [] }],
  ["savoyarde", { ...base, id: "savoyarde", name: "Savoyarde d'hiver", priceCents: 1490, isPizza: true, isEditionOnly: true, allowedSupplements: [] }],
  ["stocked", { ...base, id: "stocked", name: "Reine", priceCents: 1200, isPizza: true, stockQuantity: 2, allowedSupplements: [] }],
  ["off", { ...base, id: "off", name: "Hawaïenne", priceCents: 1250, isPizza: true, isAvailable: false, allowedSupplements: [] }],
  ["reine", { ...base, id: "reine", name: "Reine", priceCents: 900, isPizza: true, allowedSupplements: [chevre], optionSlots: [size] }],
  ["menu", { ...base, id: "menu", name: "Menu Solo", priceCents: 1750, isPizza: false, isMenu: true, allowedSupplements: [] }],
]);

const line = (productId: string, quantity = 1, supplementIds: string[] = [], choices: LineChoice[] = []): CartLineInput => ({
  productId,
  quantity,
  cooking: "NORMAL",
  supplementIds,
  choices,
});

const codeOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    if (error instanceof CartError) return error.code;
    throw error;
  }
  return null;
};

test("unitPriceCents applies discount with rounding", () => {
  expect(unitPriceCents({ priceCents: 1250, discountPercent: 15 })).toBe(1063);
  expect(unitPriceCents({ priceCents: 1050, discountPercent: 0 })).toBe(1050);
});

test("priceCart sums supplements per unit times quantity", () => {
  const c = priceCart([line("marg", 2, ["egg"])], PRODUCTS);
  expect(c.lines[0]).toMatchObject({ unitPriceCents: 1050, supplementsTotalCents: 200, lineTotalCents: 2300, isReward: false });
  expect(c).toMatchObject({ subtotalCents: 2300, pizzaCount: 2, rewardCents: 0 });
});

test("pizzaCount ignores non-pizza lines", () => {
  expect(priceCart([line("marg", 1), line("coke", 3)], PRODUCTS).pizzaCount).toBe(1);
});

test("reward frees one unit price, supplements stay paid", () => {
  const c = priceCart([line("marg", 2, ["egg"])], PRODUCTS, { rewardLineIndex: 0 });
  expect(c.rewardCents).toBe(1050);
  expect(c.lines[0].isReward).toBe(true);
  expect(orderTotalCents(c, 0)).toBe(1250);
  expect(orderTotalCents(c, 250)).toBe(1500);
});

test("current edition product can be ordered", () => {
  expect(priceCart([line("savoyarde")], PRODUCTS, { currentEditionProductId: "savoyarde" }).subtotalCents).toBe(1490);
});

describe("priceCart rejects tampered carts", () => {
  test.each([
    ["zero quantity", [line("marg", 0)], {}, "INVALID_QUANTITY"],
    ["huge quantity", [line("marg", 99)], {}, "INVALID_QUANTITY"],
    ["fractional quantity", [line("marg", 1.5)], {}, "INVALID_QUANTITY"],
    ["unknown product", [line("ghost")], {}, "UNKNOWN_PRODUCT"],
    ["unavailable product", [line("off")], {}, "UNAVAILABLE"],
    ["supplement not linked", [line("marg", 1, ["ham-not-allowed"])], {}, "SUPPLEMENT_NOT_ALLOWED"],
    ["past edition", [line("old-edition")], { currentEditionProductId: "savoyarde" }, "EDITION_OVER"],
    ["reward on a drink", [line("coke")], { rewardLineIndex: 0 }, "REWARD_NOT_PIZZA"],
    ["reward index out of range", [line("marg")], { rewardLineIndex: 3 }, "REWARD_NOT_PIZZA"],
    ["empty cart", [], {}, "EMPTY"],
  ] as const)("%s", (_name, lines, options, code) => {
    expect(codeOf(() => priceCart([...lines], PRODUCTS, options))).toBe(code);
  });

  test("stock counts all lines of the same product", () => {
    expect(codeOf(() => priceCart([line("stocked", 1), line("stocked", 2)], PRODUCTS))).toBe("OUT_OF_STOCK");
    expect(codeOf(() => priceCart([line("stocked", 2)], PRODUCTS))).toBeNull();
  });

  test("out of stock error names the product", () => {
    try {
      priceCart([line("stocked", 3)], PRODUCTS);
    } catch (error) {
      expect((error as CartError).productName).toBe("Reine");
    }
  });
});

test("options add to the unit price and the free pizza covers them", () => {
  const cart = priceCart([line("reine", 2, ["chevre"], [{ slotId: "s1", optionId: "l" }])], PRODUCTS, { rewardLineIndex: 0 });
  expect(cart.lines[0]).toMatchObject({ unitPriceCents: 900, choicesTotalCents: 400, supplementsTotalCents: 300, lineTotalCents: 2500 });
  expect(cart.lines[0].choices).toEqual([{ slotId: "s1", optionId: "l", label: "Taille", name: "Large 33 cm", unitPriceCents: 200 }]);
  expect(cart.rewardCents).toBe(1100);
});

test("missing size is refused with the product name", () => {
  expect(() => priceCart([line("reine", 1)], PRODUCTS)).toThrow(expect.objectContaining({ code: "OPTIONS_INCOMPLETE", productName: "Reine" }));
});

test("an option of another product is refused", () => {
  expect(codeOf(() => priceCart([line("marg", 1, [], [{ slotId: "s1", optionId: "l" }])], PRODUCTS))).toBe("OPTION_NOT_ALLOWED");
});

test("a menu cannot be the free pizza and is flagged as a menu", () => {
  expect(priceCart([line("menu")], PRODUCTS).lines[0]).toMatchObject({ isMenu: true, isPizza: false });
  expect(codeOf(() => priceCart([line("menu")], PRODUCTS, { rewardLineIndex: 0 }))).toBe("REWARD_NOT_PIZZA");
});
