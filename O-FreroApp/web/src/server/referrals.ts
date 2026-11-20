import { randomInt } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

/** No 0/O, 1/I/L: easy to read aloud and to type. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const REFERRAL_BONUS_STAMPS = 1;

export function generateReferralCode(): string {
  return Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

const normalize = (code: string) => code.replace(/\s+/g, "").toUpperCase();

/** The account's code, created on first need (retried on the rare collision). */
export async function ensureReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { referralCode: true } });
  if (user.referralCode) return user.referralCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const code = generateReferralCode();
      const { count } = await prisma.user.updateMany({ where: { id: userId, referralCode: null }, data: { referralCode: code } });
      if (count === 1) return code;
      return (await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { referralCode: true } })).referralCode!;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
    }
  }
  throw new Error("Impossible de créer un code de parrainage.");
}

export async function resolveReferrer(code: string | null | undefined): Promise<string | null> {
  if (!code || !code.trim()) return null;
  const user = await prisma.user.findUnique({ where: { referralCode: normalize(code) }, select: { id: true } });
  return user?.id ?? null;
}

/**
 * At the first completed pickup order of a referred customer: one stamp for them and one for their referrer.
 * Called inside the completion transaction; the unique (orderId, kind) and the "no welcome bonus yet" check
 * make it happen once.
 */
export async function creditReferralBonus(
  tx: Prisma.TransactionClient,
  order: { id: string; userId: string; mode: "PICKUP" | "DELIVERY" },
): Promise<void> {
  if (order.mode !== "PICKUP") return;
  const user = await tx.user.findUnique({ where: { id: order.userId }, select: { referredById: true } });
  const referrerId = user?.referredById;
  if (!referrerId || referrerId === order.userId) return;
  if (await tx.loyaltyEntry.findFirst({ where: { userId: order.userId, kind: "REFEREE_BONUS" }, select: { id: true } })) return;
  await tx.loyaltyEntry.createMany({
    data: [
      { userId: order.userId, orderId: order.id, kind: "REFEREE_BONUS", stamps: REFERRAL_BONUS_STAMPS },
      { userId: referrerId, orderId: order.id, kind: "REFERRER_BONUS", stamps: REFERRAL_BONUS_STAMPS },
    ],
    skipDuplicates: true,
  });
}

export async function getReferralSummary(userId: string): Promise<{ code: string; friends: number; stampsEarned: number }> {
  const [code, friends, bonuses] = await Promise.all([
    ensureReferralCode(userId),
    prisma.user.count({ where: { referredById: userId } }),
    prisma.loyaltyEntry.aggregate({ where: { userId, kind: "REFERRER_BONUS" }, _sum: { stamps: true } }),
  ]);
  return { code, friends, stampsEarned: bonuses._sum.stamps ?? 0 };
}
