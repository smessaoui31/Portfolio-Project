import { MAX_LINE_QUANTITY } from "./cart";
import type { CartLineInput, Cooking } from "./types";

export interface PricedProduct {
  id: string;
  name: string;
  priceCents: number;
  discountPercent: number;
  isPizza: boolean;
  isAvailable: boolean;
  /** null = unlimited */
  stockQuantity: number | null;
  isEditionOnly: boolean;
  /** Supplement prices already include per-product overrides. */
  allowedSupplements: { id: string; name: string; priceCents: number }[];
}

export interface PricedLine {
  productId: string;
  name: string;
  quantity: number;
  cooking: Cooking;
  unitPriceCents: number;
  supplements: { id: string; name: string; unitPriceCents: number }[];
  /** Supplements per unit times quantity. */
  supplementsTotalCents: number;
  lineTotalCents: number;
  isPizza: boolean;
  isReward: boolean;
}

export interface PricedCart {
  lines: PricedLine[];
  subtotalCents: number;
  rewardCents: number;
  pizzaCount: number;
}

export type CartErrorCode =
  | "EMPTY"
  | "INVALID_QUANTITY"
  | "UNKNOWN_PRODUCT"
  | "UNAVAILABLE"
  | "OUT_OF_STOCK"
  | "SUPPLEMENT_NOT_ALLOWED"
  | "EDITION_OVER"
  | "REWARD_NOT_PIZZA";

export class CartError extends Error {
  constructor(
    readonly code: CartErrorCode,
    readonly productName?: string,
  ) {
    super(code);
    this.name = "CartError";
  }
}

export function unitPriceCents(p: { priceCents: number; discountPercent: number }): number {
  return Math.round((p.priceCents * (100 - p.discountPercent)) / 100);
}

export function priceCart(
  lines: CartLineInput[],
  products: Map<string, PricedProduct>,
  opts: { rewardLineIndex?: number; currentEditionProductId?: string | null } = {},
): PricedCart {
  if (lines.length === 0) throw new CartError("EMPTY");

  const quantities = new Map<string, number>();
  const priced = lines.map((line): PricedLine => {
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_LINE_QUANTITY) {
      throw new CartError("INVALID_QUANTITY");
    }
    const product = products.get(line.productId);
    if (!product) throw new CartError("UNKNOWN_PRODUCT");
    if (!product.isAvailable) throw new CartError("UNAVAILABLE", product.name);
    if (product.isEditionOnly && product.id !== opts.currentEditionProductId) {
      throw new CartError("EDITION_OVER", product.name);
    }

    const supplements = [...new Set(line.supplementIds)].map((id) => {
      const supplement = product.allowedSupplements.find((s) => s.id === id);
      if (!supplement) throw new CartError("SUPPLEMENT_NOT_ALLOWED", product.name);
      return { id: supplement.id, name: supplement.name, unitPriceCents: supplement.priceCents };
    });

    quantities.set(product.id, (quantities.get(product.id) ?? 0) + line.quantity);

    const unit = unitPriceCents(product);
    const perUnitSupplements = supplements.reduce((sum, s) => sum + s.unitPriceCents, 0);
    return {
      productId: product.id,
      name: product.name,
      quantity: line.quantity,
      cooking: line.cooking,
      unitPriceCents: unit,
      supplements,
      supplementsTotalCents: perUnitSupplements * line.quantity,
      lineTotalCents: (unit + perUnitSupplements) * line.quantity,
      isPizza: product.isPizza,
      isReward: false,
    };
  });

  for (const [productId, quantity] of quantities) {
    const product = products.get(productId)!;
    if (product.stockQuantity !== null && quantity > product.stockQuantity) {
      throw new CartError("OUT_OF_STOCK", product.name);
    }
  }

  let rewardCents = 0;
  if (opts.rewardLineIndex !== undefined) {
    const rewarded = priced[opts.rewardLineIndex];
    if (!rewarded?.isPizza) throw new CartError("REWARD_NOT_PIZZA");
    rewarded.isReward = true;
    rewardCents = rewarded.unitPriceCents;
  }

  return {
    lines: priced,
    subtotalCents: priced.reduce((sum, l) => sum + l.lineTotalCents, 0),
    rewardCents,
    pizzaCount: priced.filter((l) => l.isPizza).reduce((sum, l) => sum + l.quantity, 0),
  };
}

export function orderTotalCents(cart: PricedCart, deliveryFeeCents: number): number {
  return cart.subtotalCents - cart.rewardCents + deliveryFeeCents;
}
