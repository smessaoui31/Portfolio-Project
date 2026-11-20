import { choiceText, resolveChoices } from "@/domain/options";
import type { CartLineInput } from "@/domain/types";
import { prisma } from "@/lib/db";
import { describeLines, type DescribedLine } from "./cart";
import { getCurrentEditionProductId, getPricedProducts } from "./catalog";

/**
 * Keeps the lines that can still be ordered now (available, in stock, in their edition, valid choices),
 * drops supplements that are no longer offered, and names the lines that were left out.
 */
export async function checkOrderableLines(
  lines: (CartLineInput & { name?: string })[],
  now: Date,
): Promise<{ lines: DescribedLine[]; skipped: string[] }> {
  const [products, editionProductId] = await Promise.all([
    getPricedProducts(lines.map((l) => l.productId)),
    getCurrentEditionProductId(now),
  ]);
  const kept: CartLineInput[] = [];
  const skipped: string[] = [];
  for (const line of lines) {
    const product = products.get(line.productId);
    const orderable =
      product &&
      product.isAvailable &&
      product.stockQuantity !== 0 &&
      (!product.isEditionOnly || product.id === editionProductId) &&
      resolveChoices(product.optionSlots, line.choices ?? []).ok;
    if (!product || !orderable) {
      skipped.push(line.name ?? product?.name ?? "Un produit");
      continue;
    }
    const allowed = new Set(product.allowedSupplements.map((s) => s.id));
    kept.push({
      productId: line.productId,
      quantity: line.quantity,
      cooking: line.cooking,
      supplementIds: line.supplementIds.filter((id) => allowed.has(id)),
      choices: line.choices ?? [],
    });
  }
  return { lines: await describeLines(kept), skipped };
}

const FINISHED = ["RECEIVED", "IN_OVEN", "READY", "OUT_FOR_DELIVERY", "COMPLETED", "NOT_COLLECTED"] as const;

/** The account's latest real order, summarised for the home "Recommander" card. */
export async function getLastAccountOrderSummary(userId: string): Promise<{ orderId: string; summary: string } | null> {
  const order = await prisma.order.findFirst({
    where: { userId, status: { in: [...FINISHED] } },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { choices: { orderBy: { id: "asc" } } } } },
  });
  if (!order) return null;
  const summary = order.items
    .map((item) => [`${item.quantity} × ${item.name}`, ...item.choices.map(choiceText)].join(" · "))
    .join(", ");
  return { orderId: order.id, summary };
}
