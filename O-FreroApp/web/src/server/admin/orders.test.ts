import { beforeEach, expect, test } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "../test/db";
import { makeOrder } from "../test/fixtures";
import { countNewOrders, countRefundsToDo, getAdminOrder, listOrders } from "./orders";
import { getDashboardStats } from "./stats";

const NOW = new Date("2026-11-19T19:00:00Z"); // Thursday 20:00 Paris

beforeEach(resetDb);

test("getDashboardStats counts only completed revenue and pending cash", async () => {
  await makeOrder({ status: "COMPLETED", totalCents: 2300, createdAt: new Date("2026-11-19T17:00:00Z") });
  await makeOrder({ status: "RECEIVED", paymentMethod: "AT_PICKUP", totalCents: 1500, createdAt: new Date("2026-11-19T18:00:00Z") });
  await makeOrder({ status: "CANCELLED", totalCents: 999, createdAt: new Date("2026-11-19T18:10:00Z") });
  await makeOrder({ status: "COMPLETED", totalCents: 4000, createdAt: new Date("2026-11-15T18:00:00Z") });
  await makeOrder({ status: "COMPLETED", totalCents: 7000, createdAt: new Date("2026-11-01T18:00:00Z") });

  const stats = await getDashboardStats(NOW);
  expect(stats).toMatchObject({ todayCount: 2, todayRevenueCents: 2300, weekRevenueCents: 6300, toCollectCents: 1500 });
  expect(stats.byStatus.RECEIVED).toBe(1);
  expect(stats.last14Days).toHaveLength(14);
  expect(stats.last14Days.at(-1)).toEqual({ date: "2026-11-19", revenueCents: 2300 });
  expect(stats.last14Days.find((d) => d.date === "2026-11-15")?.revenueCents).toBe(4000);
});

test("listOrders shows the day's orders by slot, with filters", async () => {
  await makeOrder({ slotAt: new Date("2026-11-19T19:30:00Z"), mode: "DELIVERY", paymentMethod: "ONLINE" });
  await makeOrder({ slotAt: new Date("2026-11-19T18:45:00Z") });
  await makeOrder({ slotAt: new Date("2026-11-19T18:00:00Z"), status: "COMPLETED" });
  await makeOrder({ slotAt: new Date("2026-11-20T18:00:00Z") });
  await makeOrder({ slotAt: new Date("2026-11-19T18:50:00Z"), status: "PENDING_PAYMENT", paymentMethod: "ONLINE" });

  const all = await listOrders({ date: "2026-11-19" });
  expect(all.map((o) => o.slotAt.toISOString())).toEqual([
    "2026-11-19T18:00:00.000Z",
    "2026-11-19T18:45:00.000Z",
    "2026-11-19T18:50:00.000Z",
    "2026-11-19T19:30:00.000Z",
  ]);
  expect((await listOrders({ date: "2026-11-19", activeOnly: true })).map((o) => o.status)).toEqual(["RECEIVED", "RECEIVED"]);
  expect(await listOrders({ date: "2026-11-19", mode: "DELIVERY" })).toHaveLength(1);
  expect((await listOrders({ date: "2026-11-19", status: "PENDING_PAYMENT" })).map((o) => o.status)).toEqual(["PENDING_PAYMENT"]);
  expect(all[1]).toMatchObject({ firstName: "Karim", phone: "0600000000", itemsCount: 1, paymentMethod: "AT_PICKUP", needsRefund: false });
});

test("getAdminOrder returns items, supplements and logs", async () => {
  const order = await makeOrder({ pizzas: 2 });
  await prisma.orderLog.create({ data: { orderId: order.id, status: "RECEIVED", message: "Commande passée en ligne" } });
  const detail = await getAdminOrder(order.id);
  expect(detail?.items[0]).toMatchObject({ name: "Pizza test", quantity: 2 });
  expect(detail?.logs).toHaveLength(1);
  expect(await getAdminOrder("nope")).toBeNull();
});

test("countNewOrders counts orders received after a date", async () => {
  const a = await makeOrder();
  const b = await makeOrder();
  await prisma.orderLog.create({ data: { orderId: a.id, status: "RECEIVED", createdAt: new Date("2026-11-19T18:00:00Z") } });
  await prisma.orderLog.create({ data: { orderId: b.id, status: "RECEIVED", createdAt: new Date("2026-11-19T18:05:00Z") } });
  await prisma.orderLog.create({ data: { orderId: b.id, status: "IN_OVEN", createdAt: new Date("2026-11-19T18:06:00Z") } });
  expect(await countNewOrders(new Date("2026-11-19T18:01:00Z"))).toEqual({ count: 1, newest: "2026-11-19T18:05:00.000Z" });
  expect(await countNewOrders(new Date("2026-11-19T18:10:00Z"))).toEqual({ count: 0, newest: null });
});

test("countRefundsToDo counts cancelled paid orders not yet refunded", async () => {
  const order = await makeOrder({ status: "CANCELLED", paymentMethod: "ONLINE" });
  await prisma.orderLog.create({ data: { orderId: order.id, status: "CANCELLED", message: "Commande payée en ligne puis annulée : à rembourser depuis Stripe" } });
  expect(await countRefundsToDo()).toBe(1);
  await prisma.orderLog.create({ data: { orderId: order.id, status: "CANCELLED", message: "Remboursement effectué" } });
  expect(await countRefundsToDo()).toBe(0);
});
