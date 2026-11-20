import type { FulfillmentMode } from "./types";

/**
 * One stamp per pickup order that holds a pizza or a menu, whatever the quantity.
 * Delivery has no loyalty, and the order that uses the free pizza earns none.
 */
export function stampsEarned(order: { mode: FulfillmentMode; rewardCents: number; hasPizzaOrMenu: boolean }): 0 | 1 {
  return order.mode === "PICKUP" && order.rewardCents === 0 && order.hasPizzaOrMenu ? 1 : 0;
}

export function stampBalance(entries: { kind: "EARN" | "REDEEM"; stamps: number }[]): number {
  return entries.reduce((sum, e) => sum + (e.kind === "EARN" ? e.stamps : -e.stamps), 0);
}

export function canRedeem(balance: number, stampsForReward: number): boolean {
  return balance >= stampsForReward;
}
