"use server";

import { z } from "zod";
import { CartError, priceCart, type PricedCart } from "@/domain/pricing";
import type { CartLineInput } from "@/domain/types";
import { now } from "@/lib/clock";
import { getSession } from "@/lib/session";
import { describeLines, mergeIntoAccount, saveCart, type DescribedLine } from "@/server/cart";
import { getCurrentEditionProductId, getPricedProducts } from "@/server/catalog";
import { orderErrorMessage } from "@/server/orders";
import { getLoyaltySummary } from "@/server/loyalty";
import { checkOrderableLines } from "@/server/reorder";
import { getSettings } from "@/server/settings";

const linesSchema = z
  .array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number(),
      cooking: z.enum(["NORMAL", "WELL_DONE", "LIGHTLY_COOKED"]),
      supplementIds: z.array(z.string()).max(10),
      choices: z.array(z.object({ slotId: z.string(), optionId: z.string() })).max(12).default([]),
    }),
  )
  .max(30);

const clean = (lines: CartLineInput[]): CartLineInput[] =>
  lines.map(({ productId, quantity, cooking, supplementIds, choices }) => ({ productId, quantity, cooking, supplementIds, choices: choices ?? [] }));

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

/** Lines remembered on the phone, re-checked now: what can still be ordered, and what cannot. */
export async function checkLinesAction(lines: (CartLineInput & { name?: string })[]): Promise<{ lines: DescribedLine[]; skipped: string[] }> {
  const parsed = linesSchema.safeParse(clean(lines));
  if (!parsed.success) return { lines: [], skipped: [] };
  const named = parsed.data.map((line, index) => ({ ...line, name: typeof lines[index]?.name === "string" ? lines[index].name : undefined }));
  return checkOrderableLines(named, now());
}

/** Stamps of the signed-in customer, for the cart hint. */
export async function loyaltyHintAction(): Promise<{ signedIn: boolean; balance: number; stampsForReward: number }> {
  const session = await getSession();
  if (!session) return { signedIn: false, balance: 0, stampsForReward: (await getSettings()).stampsForReward };
  const summary = await getLoyaltySummary(session.user.id);
  return { signedIn: true, balance: summary.balance, stampsForReward: summary.stampsForReward };
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
