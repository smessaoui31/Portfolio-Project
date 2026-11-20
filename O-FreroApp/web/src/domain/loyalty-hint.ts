import type { FulfillmentMode } from "./types";

/**
 * What the cart says about stamps. Delivery earns none, so it says nothing;
 * `mode` is null in the cart, before the customer chooses.
 */
export function stampHint(o: {
  signedIn: boolean;
  mode: FulfillmentMode | null;
  balance: number;
  stampsForReward: number;
  /** The free pizza is applied to this order. */
  usingReward?: boolean;
}): string | null {
  if (o.mode === "DELIVERY") return null;
  if (!o.signedIn) return "Avec un compte, cette commande te rapporterait 1 tampon.";
  if (o.usingReward) return "Cette commande utilise ta pizza offerte : elle ne rapporte pas de tampon.";
  if (o.balance >= o.stampsForReward) return "Ta pizza offerte t'attend.";
  const left = o.stampsForReward - o.balance - 1;
  if (left <= 0) return "Cette commande te rapporte 1 tampon : ta prochaine pizza sera offerte.";
  return `Cette commande te rapporte 1 tampon : plus que ${left} commande${left > 1 ? "s" : ""} avant ta pizza offerte.`;
}
