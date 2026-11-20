import { beforeEach, expect, test, vi } from "vitest";
import { prisma } from "@/lib/db";
import { getTracking } from "./lifecycle";
import { rateOrder } from "./ratings";
import { resetDb } from "./test/db";
import { makeOrder } from "./test/fixtures";

vi.mock("@/lib/email", () => ({ sendEmail: async () => ({ delivered: false }) }));

beforeEach(resetDb);

test("only completed orders can be rated, once", async () => {
  const received = await makeOrder({ status: "RECEIVED" });
  const done = await makeOrder({ status: "COMPLETED" });
  expect(await rateOrder(received.trackingToken, 3)).toEqual({ ok: false, error: "NOT_COMPLETED" });
  expect(await rateOrder(done.trackingToken, 3, "  Top  ")).toEqual({ ok: true });
  expect(await rateOrder(done.trackingToken, 1)).toEqual({ ok: false, error: "ALREADY_RATED" });
  expect(await prisma.orderRating.findUnique({ where: { orderId: done.id } })).toMatchObject({ score: 3, comment: "Top" });
  expect(await rateOrder("unknown", 2)).toEqual({ ok: false, error: "NOT_FOUND" });
});

test("bad scores and too long comments are refused; an empty comment is stored as none", async () => {
  const done = await makeOrder({ status: "COMPLETED" });
  expect(await rateOrder(done.trackingToken, 4 as never)).toEqual({ ok: false, error: "INVALID" });
  expect(await rateOrder(done.trackingToken, 2, "x".repeat(281))).toEqual({ ok: false, error: "INVALID" });
  expect(await rateOrder(done.trackingToken, 2, "   ")).toEqual({ ok: true });
  expect(await prisma.orderRating.findUnique({ where: { orderId: done.id } })).toMatchObject({ score: 2, comment: null });
});

test("tracking tells whether the order can be rated and shows the rating", async () => {
  const done = await makeOrder({ status: "COMPLETED" });
  expect(await getTracking(done.trackingToken)).toMatchObject({ canRate: true, rating: null });
  await rateOrder(done.trackingToken, 3, "Croustillante");
  expect(await getTracking(done.trackingToken)).toMatchObject({ canRate: false, rating: { score: 3, comment: "Croustillante" } });
  expect(await getTracking((await makeOrder({ status: "IN_OVEN" })).trackingToken)).toMatchObject({ canRate: false });
});
