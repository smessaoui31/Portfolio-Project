import { stampBalance } from "@/domain/loyalty";
import { prisma } from "@/lib/db";
import { getSettings } from "./settings";

export interface LoyaltySummary {
  balance: number;
  stampsForReward: number;
  /** Editions the account has received (completed orders). */
  tastedEditionIds: string[];
}

export async function getLoyaltySummary(userId: string): Promise<LoyaltySummary> {
  const [entries, settings, tasted] = await Promise.all([
    // A free pizza held by an unpaid online order is still available: that order is released on the next one.
    prisma.loyaltyEntry.findMany({
      where: { userId, NOT: { kind: "REDEEM", order: { status: "PENDING_PAYMENT" } } },
      select: { kind: true, stamps: true },
    }),
    getSettings(),
    prisma.order.findMany({
      where: { userId, status: "COMPLETED", editionId: { not: null } },
      select: { editionId: true },
      distinct: ["editionId"],
    }),
  ]);
  return {
    balance: stampBalance(entries),
    stampsForReward: settings.stampsForReward,
    tastedEditionIds: tasted.map((o) => o.editionId!),
  };
}
