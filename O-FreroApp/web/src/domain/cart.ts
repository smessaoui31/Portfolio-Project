import type { CartLineInput } from "./types";

export const MAX_LINE_QUANTITY = 20;

/** Identity of a cart line: product, cooking, the set of supplements and the set of choices. */
export function lineKey(line: CartLineInput): string {
  const choices = (line.choices ?? []).map((c) => `${c.slotId}:${c.optionId}`).sort();
  return [line.productId, line.cooking, [...line.supplementIds].sort().join(","), choices.join(",")].join("|");
}

/** Lines of `a`, then new lines of `b`; equal lines add up, capped at MAX_LINE_QUANTITY. */
export function mergeCartLines(a: CartLineInput[], b: CartLineInput[]): CartLineInput[] {
  const merged = new Map<string, CartLineInput>();
  for (const line of [...a, ...b]) {
    const key = lineKey(line);
    const existing = merged.get(key);
    merged.set(
      key,
      existing
        ? { ...existing, quantity: Math.min(MAX_LINE_QUANTITY, existing.quantity + line.quantity) }
        : { ...line, quantity: Math.min(MAX_LINE_QUANTITY, line.quantity) },
    );
  }
  return [...merged.values()];
}
