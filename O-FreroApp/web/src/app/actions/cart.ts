"use server";

import { z } from "zod";
import { CartError, priceCart, type PricedCart } from "@/domain/pricing";
import type { CartLineInput } from "@/domain/types";
import { now } from "@/lib/clock";
import { getSession } from "@/lib/session";
import { describeLines, mergeIntoAccount, saveCart, type DescribedLine } from "@/server/cart";
import { getCurrentEditionProductId, getPricedProducts } from "@/server/catalog";
import { orderErrorMessage } from "@/server/orders";

const linesSchema = z
  .array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number(),
      cooking: z.enum(["NORMAL", "WELL_DONE", "EXTRA_CRISPY"]),
      supplementIds: z.array(z.string()).max(10),
    }),
  )
  .max(30);

const clean = (lines: CartLineInput[]): CartLineInput[] =>
  lines.map(({ productId, quantity, cooking, supplementIds }) => ({ productId, quantity, cooking, supplementIds }));

export type QuoteResult = { ok: true; quote: PricedCart } | { ok: false; message: string };

/** The only price computation shown in the cart: always done by the server. */
export async function quoteCartAction(lines: CartLineInput[], rewardLineIndex?: number): Promise<QuoteResult> {
  const parsed = linesSchema.safeParse(clean(lines));
  if (!parsed.success) return { ok: false, message: orderErrorMessage("VALIDATION") };
  if (parsed.data.length === 0) return { ok: true, quote: { lines: [], subtotalCents: 0, rewardCents: 0, pizzaCount: 0 } };
  const [products, editionProductId] = await Promise.all([
    getPricedProducts(parsed.data.map((l) => l.productId)),
    getCurrentEditionProductId(now()),
  ]);
  try {
    return { ok: true, quote: priceCart(parsed.data, products, { rewardLineIndex, currentEditionProductId: editionProductId }) };
  } catch (error) {
    if (error instanceof CartError) return { ok: false, message: orderErrorMessage(error.code, { productName: error.productName }) };
    throw error;
  }
}

export async function syncCartAction(lines: CartLineInput[]): Promise<void> {
  const session = await getSession();
  const parsed = linesSchema.safeParse(clean(lines));
  if (!session || !parsed.success) return;
  await saveCart(session.user.id, parsed.data);
}

/** At sign-in: merges this device's cart into the account's and returns the result. */
export async function mergeCartAction(local: CartLineInput[]): Promise<DescribedLine[] | null> {
  const session = await getSession();
  const parsed = linesSchema.safeParse(clean(local));
  if (!session || !parsed.success) return null;
  return describeLines(await mergeIntoAccount(session.user.id, parsed.data));
}
