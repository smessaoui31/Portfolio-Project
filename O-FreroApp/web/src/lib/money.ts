const euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

/** Formats an amount in cents, e.g. 1490 -> "14,90 €". */
export function formatEuros(cents: number): string {
  return euros.format(cents / 100);
}

/** Reads an amount typed in euros ("12,50", "12.5", "9") into cents; null if invalid. */
export function parseEuros(input: string): number | null {
  const compact = input.replace(/\s+/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(compact)) return null;
  return Math.round(Number(compact) * 100);
}
