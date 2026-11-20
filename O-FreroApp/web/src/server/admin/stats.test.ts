import { beforeEach, expect, test } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "../test/db";
import { makeOrder, makeUser } from "../test/fixtures";
import { getRecentRatings, getRetentionStats } from "./stats";

const NOW = new Date("2026-11-20T12:00:00Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60_000);

beforeEach(resetDb);

test("retention over 90 days", async () => {
  await makeOrder({ customerEmail: "a@exemple.fr", status: "COMPLETED", createdAt: daysAgo(20) });
  await makeOrder({ customerEmail: "a@exemple.fr", status: "COMPLETED", createdAt: daysAgo(10), source: "REORDER" });
  await makeOrder({ customerEmail: "b@exemple.fr", status: "RECEIVED", createdAt: daysAgo(3) });
  await makeOrder({ customerEmail: "c@exemple.fr", status: "CANCELLED", createdAt: daysAgo(2) });
  await makeOrder({ customerEmail: "d@exemple.fr", status: "COMPLETED", createdAt: daysAgo(120) });
  expect(await getRetentionStats(NOW)).toMatchObject({
    customers: 2,
    returningPercent: 50,
    medianDaysBetweenOrders: 10,
    reorderPercent: 33,
    referrals: 0,
    ratingAverage: null,
    ratingCount: 0,
  });
});

test("referrals and ratings are counted", async () => {
  const parrain = await makeUser();
  const filleul = await makeUser({ referredById: parrain.id });
  const order = await makeOrder({ userId: filleul.id, status: "COMPLETED", createdAt: daysAgo(5) });
  await prisma.loyaltyEntry.createMany({
    data: [
      { userId: filleul.id, orderId: order.id, kind: "REFEREE_BONUS", stamps: 1 },
      { userId: parrain.id, orderId: order.id, kind: "REFERRER_BONUS", stamps: 1 },
    ],
  });
  const other = await makeOrder({ status: "COMPLETED", createdAt: daysAgo(4) });
  await prisma.orderRating.createMany({
    data: [
      { orderId: order.id, score: 3, comment: "Parfaite", createdAt: daysAgo(4) },
      { orderId: other.id, score: 2, createdAt: daysAgo(3) },
    ],
  });
  expect(await getRetentionStats(NOW)).toMatchObject({ referrals: 1, ratingAverage: 2.5, ratingCount: 2 });
  expect(await getRecentRatings(NOW)).toMatchObject({ average: 2.5, count: 2, comments: [{ score: 3, comment: "Parfaite" }] });
});
