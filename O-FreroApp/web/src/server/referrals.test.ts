import { beforeEach, expect, test, vi } from "vitest";
import { stampBalance } from "@/domain/loyalty";
import { prisma } from "@/lib/db";
import { advanceOrderStatus } from "./lifecycle";
import { ensureReferralCode, generateReferralCode, getReferralSummary, resolveReferrer } from "./referrals";
import { resetDb } from "./test/db";
import { makeOrder, makeUser } from "./test/fixtures";

vi.mock("@/lib/email", () => ({ sendEmail: async () => ({ delivered: false }) }));

beforeEach(resetDb);

const balance = async (userId: string) => stampBalance(await prisma.loyaltyEntry.findMany({ where: { userId } }));

async function complete(userId: string, mode: "PICKUP" | "DELIVERY" = "PICKUP") {
  const order = await makeOrder({ userId, mode, paymentMethod: mode === "PICKUP" ? "AT_PICKUP" : "ONLINE", status: mode === "PICKUP" ? "READY" : "OUT_FOR_DELIVERY" });
  expect(await advanceOrderStatus(order.id, "COMPLETED", "admin@ofrero.test")).toEqual({ ok: true });
  return order;
}

test("codes avoid ambiguous characters", () => {
  for (let i = 0; i < 50; i++) expect(generateReferralCode()).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
});

test("ensureReferralCode creates the code once", async () => {
  const user = await makeUser();
  const code = await ensureReferralCode(user.id);
  expect(code).toMatch(/^[A-Z2-9]{6}$/);
  expect(await ensureReferralCode(user.id)).toBe(code);
});

test("resolveReferrer normalises the code and ignores unknown ones", async () => {
  const parrain = await makeUser({ referralCode: "AB3K9Z" });
  expect(await resolveReferrer(" ab3k9z ")).toBe(parrain.id);
  expect(await resolveReferrer("ZZZZZZ")).toBeNull();
  expect(await resolveReferrer(undefined)).toBeNull();
});

test("the first completed pickup order of the referee credits both, once", async () => {
  const parrain = await makeUser({ referralCode: "AB3K9Z" });
  const filleul = await makeUser({ referredById: parrain.id });
  await complete(filleul.id);
  await complete(filleul.id);
  expect(await balance(filleul.id)).toBe(3); // two order stamps + one welcome bonus
  expect(await balance(parrain.id)).toBe(1);
  expect(await getReferralSummary(parrain.id)).toMatchObject({ code: "AB3K9Z", friends: 1, stampsEarned: 1 });
});

test("a delivery order gives no referral bonus", async () => {
  const parrain = await makeUser({ referralCode: "AB3K9Z" });
  const filleul = await makeUser({ referredById: parrain.id });
  await complete(filleul.id, "DELIVERY");
  expect(await balance(filleul.id)).toBe(0);
  expect(await balance(parrain.id)).toBe(0);
});

test("sign-up with a code stores the referrer", async () => {
  const parrain = await makeUser({ referralCode: "AB3K9Z" });
  const { auth } = await import("@/lib/auth");
  await auth.api.signUpEmail({ body: { email: "ami@exemple.fr", password: "motdepasse1", name: "Ami", referralCodeUsed: "ab3k9z" } });
  expect(await prisma.user.findUniqueOrThrow({ where: { email: "ami@exemple.fr" } })).toMatchObject({ referredById: parrain.id });
  await auth.api.signUpEmail({ body: { email: "seul@exemple.fr", password: "motdepasse1", name: "Seul", referralCodeUsed: "NOPE00" } });
  expect(await prisma.user.findUniqueOrThrow({ where: { email: "seul@exemple.fr" } })).toMatchObject({ referredById: null });
});
