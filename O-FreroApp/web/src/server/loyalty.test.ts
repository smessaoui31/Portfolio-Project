import { beforeEach, expect, test } from "vitest";
import { editionBounds } from "@/domain/editions";
import { prisma } from "@/lib/db";
import { getLoyaltySummary } from "./loyalty";
import { resetDb } from "./test/db";
import { makeEdition, makeOrder, makeUser } from "./test/fixtures";

beforeEach(resetDb);

test("getLoyaltySummary counts earn minus redeem and lists tasted editions", async () => {
  const user = await makeUser({ stamps: 12 });
  const e6 = await makeEdition({ number: 6, ...editionBounds("2026-09-01", "2026-10-31") });
  const e5 = await makeEdition({ number: 5, ...editionBounds("2026-07-01", "2026-08-31") });
  const tasted = await makeOrder({ userId: user.id, status: "COMPLETED", editionId: e6.id });
  await makeOrder({ userId: user.id, status: "CANCELLED", editionId: e5.id });
  await prisma.loyaltyEntry.create({ data: { userId: user.id, orderId: tasted.id, kind: "REDEEM", stamps: 10 } });

  expect(await getLoyaltySummary(user.id)).toEqual({ balance: 2, stampsForReward: 10, tastedEditionIds: [e6.id] });
});

test("a new account starts at zero", async () => {
  const user = await makeUser();
  expect(await getLoyaltySummary(user.id)).toEqual({ balance: 0, stampsForReward: 10, tastedEditionIds: [] });
});
