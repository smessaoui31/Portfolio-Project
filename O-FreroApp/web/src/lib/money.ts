const euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

/** Formats an amount in cents, e.g. 1490 -> "14,90 €". */
export function formatEuros(cents: number): string {
  return euros.format(cents / 100);
}
