import type { FulfillmentMode, OrderStatus, PaymentMethod } from "@/domain/types";
import { prisma } from "@/lib/db";
import { addDaysToKey, atParisTime } from "@/lib/time";

export interface AdminOrderRow {
  id: string;
  number: number;
  slotAt: Date;
  mode: FulfillmentMode;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  firstName: string;
  phone: string;
  totalCents: number;
  itemsCount: number;
}

const ACTIVE: OrderStatus[] = ["RECEIVED", "IN_OVEN", "READY", "OUT_FOR_DELIVERY"];

/** Orders whose slot falls on a Paris day, earliest slot first. Unpaid online orders are left out. */
export async function listOrders(filter: {
  date: string;
  status?: OrderStatus;
  mode?: FulfillmentMode;
  activeOnly?: boolean;
}): Promise<AdminOrderRow[]> {
  const from = atParisTime(filter.date, "00:00");
  const to = atParisTime(addDaysToKey(filter.date, 1), "00:00");
  const orders = await prisma.order.findMany({
    where: {
      slotAt: { gte: from, lt: to },
      status: filter.status ?? (filter.activeOnly ? { in: ACTIVE } : { notIn: ["PENDING_PAYMENT", "FAILED"] }),
      ...(filter.mode ? { mode: filter.mode } : {}),
    },
    orderBy: [{ slotAt: "asc" }, { number: "asc" }],
    include: { items: { select: { quantity: true } } },
  });
  return orders.map((o) => ({
    id: o.id,
    number: o.number,
    slotAt: o.slotAt,
    mode: o.mode,
    paymentMethod: o.paymentMethod,
    status: o.status,
    firstName: o.customerFirstName,
    phone: o.customerPhone,
    totalCents: o.totalCents,
    itemsCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
  }));
}

export async function getAdminOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { supplements: true } },
      logs: { orderBy: { createdAt: "asc" } },
      user: { select: { id: true, name: true, email: true } },
      edition: { select: { number: true } },
    },
  });
}

export type AdminOrder = NonNullable<Awaited<ReturnType<typeof getAdminOrder>>>;

/** Orders that became "received" (placed at pickup or paid online) after `since`. */
export async function countNewOrders(since: Date): Promise<{ count: number; newest: string | null }> {
  const logs = await prisma.orderLog.findMany({
    where: { status: "RECEIVED", createdAt: { gt: since } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return { count: logs.length, newest: logs[0]?.createdAt.toISOString() ?? null };
}
