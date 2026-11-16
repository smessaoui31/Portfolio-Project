import type { OrderStatus } from "@/domain/types";
import { prisma } from "@/lib/db";
import { addDaysToKey, atParisTime, parisDateKey } from "@/lib/time";

export interface DashboardStats {
  todayCount: number;
  todayRevenueCents: number;
  weekRevenueCents: number;
  /** Pay-at-pickup orders not finished yet. */
  toCollectCents: number;
  byStatus: Record<OrderStatus, number>;
  last14Days: { date: string; revenueCents: number }[];
}

const STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "RECEIVED",
  "IN_OVEN",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "NOT_COLLECTED",
  "CANCELLED",
  "FAILED",
];

/** Revenue counts completed orders only, by the Paris day they were placed. */
export async function getDashboardStats(now: Date): Promise<DashboardStats> {
  const today = parisDateKey(now);
  const firstDay = addDaysToKey(today, -13);
  const [recent, toCollect] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: atParisTime(firstDay, "00:00"), lt: atParisTime(addDaysToKey(today, 1), "00:00") } },
      select: { createdAt: true, status: true, totalCents: true },
    }),
    prisma.order.aggregate({
      where: { paymentMethod: "AT_PICKUP", status: { in: ["RECEIVED", "IN_OVEN", "READY"] } },
      _sum: { totalCents: true },
    }),
  ]);

  const days = Array.from({ length: 14 }, (_, i) => addDaysToKey(firstDay, i));
  const revenue = new Map(days.map((d) => [d, 0]));
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
  let todayCount = 0;

  for (const order of recent) {
    const day = parisDateKey(order.createdAt);
    if (order.status === "COMPLETED") revenue.set(day, (revenue.get(day) ?? 0) + order.totalCents);
    if (day === today) {
      byStatus[order.status] += 1;
      if (!["PENDING_PAYMENT", "FAILED", "CANCELLED"].includes(order.status)) todayCount += 1;
    }
  }

  const weekDays = new Set(days.slice(-7));
  return {
    todayCount,
    todayRevenueCents: revenue.get(today) ?? 0,
    weekRevenueCents: [...revenue].filter(([d]) => weekDays.has(d)).reduce((sum, [, v]) => sum + v, 0),
    toCollectCents: toCollect._sum.totalCents ?? 0,
    byStatus,
    last14Days: days.map((date) => ({ date, revenueCents: revenue.get(date) ?? 0 })),
  };
}
