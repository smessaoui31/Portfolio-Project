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
    prisma.loyaltyEntry.findMany({ where: { userId }, select: { kind: true, stamps: true } }),
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
