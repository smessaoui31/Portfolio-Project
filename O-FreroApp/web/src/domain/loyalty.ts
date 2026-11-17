/** One stamp per pizza; the free pizza earns none. */
export function stampsEarned(cart: { pizzaCount: number; rewardCents: number }): number {
  return Math.max(0, cart.pizzaCount - (cart.rewardCents > 0 ? 1 : 0));
}

export function stampBalance(entries: { kind: "EARN" | "REDEEM"; stamps: number }[]): number {
  return entries.reduce((sum, e) => sum + (e.kind === "EARN" ? e.stamps : -e.stamps), 0);
}

export function canRedeem(balance: number, stampsForReward: number): boolean {
  return balance >= stampsForReward;
}
