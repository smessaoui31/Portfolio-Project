"use client";

import { MAX_LINE_QUANTITY } from "@/domain/cart";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  label: string;
}) {
  const button =
    "grid size-9 place-items-center rounded-full border border-line-2 text-lg text-fg transition hover:border-muted disabled:opacity-30";
  return (
    <div className="inline-flex items-center gap-3" role="group" aria-label={label}>
      <button type="button" className={button} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Retirer un">
        −
      </button>
      <span className="w-5 text-center font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={button}
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_LINE_QUANTITY}
        aria-label="Ajouter un"
      >
        +
      </button>
    </div>
  );
}
