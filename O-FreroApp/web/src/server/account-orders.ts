import type { FulfillmentMode, OrderStatus } from "@/domain/types";
import { prisma } from "@/lib/db";
import type { DescribedLine } from "./cart";
import { checkOrderableLines } from "./reorder";

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
    include: { items: { include: { supplements: true, choices: { orderBy: { id: "asc" } } } } },
  });
  if (!order) return null;
  return checkOrderableLines(
    order.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      cooking: item.cooking,
      supplementIds: item.supplements.flatMap((s) => (s.supplementId ? [s.supplementId] : [])),
      choices: item.choices.map((c) => ({ slotId: c.slotId ?? "", optionId: c.optionId ?? "" })),
    })),
    now,
  );
}
