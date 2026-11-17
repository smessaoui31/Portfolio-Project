import type { CartLineInput, FulfillmentMode, OrderStatus } from "@/domain/types";
import { prisma } from "@/lib/db";
import { describeLines, type DescribedLine } from "./cart";
import { getCurrentEditionProductId, getPricedProducts } from "./catalog";

export interface HistoryOrder {
  id: string;
  number: number;
  createdAt: Date;
  slotAt: Date;
  status: OrderStatus;
  mode: FulfillmentMode;
  totalCents: number;
  trackingToken: string;
  summary: string;
}

export async function getOrderHistory(userId: string): Promise<HistoryOrder[]> {
  const orders = await prisma.order.findMany({
    where: { userId, status: { not: "PENDING_PAYMENT" } },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { items: { select: { name: true, quantity: true } } },
  });
  return orders.map((o) => ({
    id: o.id,
    number: o.number,
    createdAt: o.createdAt,
    slotAt: o.slotAt,
    status: o.status,
    mode: o.mode,
    totalCents: o.totalCents,
    trackingToken: o.trackingToken,
    summary: o.items.map((i) => `${i.quantity} × ${i.name}`).join(", "),
  }));
}

/** Lines of a past order that can still be ordered today, plus the names that cannot. */
export async function reorderLines(
  userId: string,
  orderId: string,
  now: Date,
): Promise<{ lines: DescribedLine[]; skipped: string[] } | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: { include: { supplements: true } } },
  });
  if (!order) return null;

  const [products, editionProductId] = await Promise.all([
    getPricedProducts(order.items.map((i) => i.productId)),
    getCurrentEditionProductId(now),
  ]);

  const lines: CartLineInput[] = [];
  const skipped: string[] = [];
  for (const item of order.items) {
    const product = products.get(item.productId);
    const orderable =
      product && product.isAvailable && product.stockQuantity !== 0 && (!product.isEditionOnly || product.id === editionProductId);
    if (!product || !orderable) {
      skipped.push(item.name);
      continue;
    }
    const allowed = new Set(product.allowedSupplements.map((s) => s.id));
    lines.push({
      productId: item.productId,
      quantity: item.quantity,
      cooking: item.cooking,
      supplementIds: item.supplements.flatMap((s) => (s.supplementId && allowed.has(s.supplementId) ? [s.supplementId] : [])),
    });
  }
  return { lines: await describeLines(lines), skipped };
}
