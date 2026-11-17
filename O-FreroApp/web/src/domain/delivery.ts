export interface ZoneLike {
  id: string;
  name: string;
  postalCodes: string[];
  feeCents: number;
  minOrderCents: number;
  isActive: boolean;
}

export type DeliveryQuote =
  | { ok: true; zone: ZoneLike; feeCents: number }
  | { ok: false; reason: "INVALID_POSTAL_CODE" | "OUT_OF_ZONE" | "BELOW_MINIMUM"; minOrderCents?: number };

/** Removes spaces; returns null unless exactly 5 digits remain. */
export function normalizePostalCode(input: string): string | null {
  const compact = input.replace(/\s+/g, "");
  return /^\d{5}$/.test(compact) ? compact : null;
}

/** `subtotalCents` is the amount after the loyalty reward, before the delivery fee. */
export function quoteDelivery(postalCode: string, subtotalCents: number, zones: ZoneLike[]): DeliveryQuote {
  const code = normalizePostalCode(postalCode);
  if (!code) return { ok: false, reason: "INVALID_POSTAL_CODE" };
  const zone = zones.find((z) => z.isActive && z.postalCodes.includes(code));
  if (!zone) return { ok: false, reason: "OUT_OF_ZONE" };
  if (subtotalCents < zone.minOrderCents) {
    return { ok: false, reason: "BELOW_MINIMUM", minOrderCents: zone.minOrderCents };
  }
  return { ok: true, zone, feeCents: zone.feeCents };
}
