"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { SNAPPY } from "@/components/motion/springs";
import { MAX_LINE_QUANTITY } from "@/domain/cart";
import { haptic } from "@/lib/haptics";

const roll = {
  enter: (direction: number) => ({ y: direction * 16, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (direction: number) => ({ y: direction * -16, opacity: 0 }),
};

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
  // Remember the previous value during render to know which way the number rolls.
  const [previous, setPrevious] = useState(value);
  const [direction, setDirection] = useState(1);
  if (value !== previous) {
    setDirection(value > previous ? 1 : -1);
    setPrevious(value);
  }
  const change = (next: number) => {
    haptic(6);
    onChange(next);
  };
  const button =
    "grid size-9 place-items-center rounded-full border border-line-2 text-lg text-fg transition hover:border-muted disabled:opacity-30";
  return (
    <div className="inline-flex items-center gap-3" role="group" aria-label={label}>
      <button type="button" className={button} onClick={() => change(value - 1)} disabled={value <= min} aria-label="Retirer un">
        −
      </button>
      <span className="relative grid h-6 w-6 place-items-center overflow-hidden font-semibold tabular-nums" aria-live="polite">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.span key={value} custom={direction} variants={roll} initial="enter" animate="center" exit="exit" transition={SNAPPY}>
            {value}
          </motion.span>
        </AnimatePresence>
      </span>
      <button
        type="button"
        className={button}
        onClick={() => change(value + 1)}
        disabled={value >= MAX_LINE_QUANTITY}
        aria-label="Ajouter un"
      >
        +
      </button>
    </div>
  );
}
