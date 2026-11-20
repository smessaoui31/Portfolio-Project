/** One slot of choices on a product: a group attached to it, with its active options in order. */
export interface OptionSlot {
  id: string;
  label: string;
  minSelect: number;
  maxSelect: number;
  options: { id: string; name: string; priceCents: number }[];
}

/** What the customer picked: one option in one slot. */
export interface LineChoice {
  slotId: string;
  optionId: string;
}

export interface PricedChoice {
  slotId: string;
  optionId: string;
  label: string;
  name: string;
  unitPriceCents: number;
}

export type ChoiceErrorCode = "OPTION_NOT_ALLOWED" | "OPTIONS_INCOMPLETE";

/** Validates the picks against the product's slots and prices them, in slot then option order. */
export function resolveChoices(
  slots: OptionSlot[],
  choices: LineChoice[],
): { ok: true; choices: PricedChoice[] } | { ok: false; code: ChoiceErrorCode } {
  const picked = new Map<string, Set<string>>();
  for (const choice of choices) {
    const slot = slots.find((s) => s.id === choice.slotId);
    if (!slot || !slot.options.some((o) => o.id === choice.optionId)) return { ok: false, code: "OPTION_NOT_ALLOWED" };
    if (!picked.has(slot.id)) picked.set(slot.id, new Set());
    picked.get(slot.id)!.add(choice.optionId);
  }

  const resolved: PricedChoice[] = [];
  for (const slot of slots) {
    const ids = picked.get(slot.id) ?? new Set<string>();
    if (ids.size < slot.minSelect || ids.size > slot.maxSelect) return { ok: false, code: "OPTIONS_INCOMPLETE" };
    for (const option of slot.options) {
      if (ids.has(option.id)) {
        resolved.push({ slotId: slot.id, optionId: option.id, label: slot.label, name: option.name, unitPriceCents: option.priceCents });
      }
    }
  }
  return { ok: true, choices: resolved };
}

/** Preselects the first option of a required single choice when that option is free. */
export function defaultChoices(slots: OptionSlot[]): LineChoice[] {
  return slots.flatMap((slot) => {
    const first = slot.options[0];
    return slot.minSelect === 1 && slot.maxSelect === 1 && first && first.priceCents === 0
      ? [{ slotId: slot.id, optionId: first.id }]
      : [];
  });
}

export function choiceText(choice: { label: string; name: string }): string {
  return `${choice.label} : ${choice.name}`;
}
