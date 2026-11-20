import type { OrderStatus } from "@/domain/types";
import { prisma } from "@/lib/db";
import { addDaysToKey, atParisTime, parisDateKey } from "@/lib/time";
import { median } from "@/domain/stats";

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

/* ---------- Retention ---------- */

const DAY_MS = 24 * 60 * 60_000;
/** Orders that really happened (paid or to be paid at pickup), whatever their progress. */
const REAL_ORDER = ["RECEIVED", "IN_OVEN", "READY", "OUT_FOR_DELIVERY", "COMPLETED", "NOT_COLLECTED"] as const;

export interface RetentionStats {
  customers: number;
  returningPercent: number;
  medianDaysBetweenOrders: number | null;
  reorderPercent: number;
  referrals: number;
  ratingAverage: number | null;
  ratingCount: number;
}

const percent = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));
const oneDecimal = (n: number) => Math.round(n * 10) / 10;

/** Over the last 90 days; a customer is an e-mail address, account or not. */
export async function getRetentionStats(now: Date): Promise<RetentionStats> {
  const since = new Date(now.getTime() - 90 * DAY_MS);
  const [orders, referrals, ratings] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: [...REAL_ORDER] }, createdAt: { gte: since, lte: now } },
      select: { customerEmail: true, createdAt: true, source: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.loyaltyEntry.count({ where: { kind: "REFEREE_BONUS", createdAt: { gte: since } } }),
    prisma.orderRating.aggregate({ where: { createdAt: { gte: since } }, _avg: { score: true }, _count: true }),
  ]);

  const byCustomer = new Map<string, Date[]>();
  for (const o of orders) byCustomer.set(o.customerEmail, [...(byCustomer.get(o.customerEmail) ?? []), o.createdAt]);
  const gaps = [...byCustomer.values()].flatMap((dates) => dates.slice(1).map((d, i) => (d.getTime() - dates[i].getTime()) / DAY_MS));
  const returning = [...byCustomer.values()].filter((dates) => dates.length >= 2).length;
  const days = median(gaps);

  return {
    customers: byCustomer.size,
    returningPercent: percent(returning, byCustomer.size),
    medianDaysBetweenOrders: days === null ? null : oneDecimal(days),
    reorderPercent: percent(orders.filter((o) => o.source === "REORDER").length, orders.length),
    referrals,
    ratingAverage: ratings._avg.score === null ? null : oneDecimal(ratings._avg.score),
    ratingCount: ratings._count,
  };
}

/** Ratings of the last 30 days: average and the latest comments. */
export async function getRecentRatings(now: Date): Promise<{ average: number | null; count: number; comments: { score: number; comment: string; createdAt: Date; orderId: string }[] }> {
  const since = new Date(now.getTime() - 30 * DAY_MS);
  const [aggregate, latest] = await Promise.all([
    prisma.orderRating.aggregate({ where: { createdAt: { gte: since } }, _avg: { score: true }, _count: true }),
    prisma.orderRating.findMany({
      where: { createdAt: { gte: since }, comment: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);
  return {
    average: aggregate._avg.score === null ? null : oneDecimal(aggregate._avg.score),
    count: aggregate._count,
    comments: latest.map((r) => ({ score: r.score, comment: r.comment!, createdAt: r.createdAt, orderId: r.orderId })),
  };
}
