"use client";

import { motion } from "motion/react";
import { useId, useRef, type KeyboardEvent } from "react";
import { SNAPPY } from "@/components/motion/springs";
import { haptic } from "@/lib/haptics";

/** Accessible radio group shown as a segmented control. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const pill = useId();
  const choose = (next: T) => {
    if (next !== value) haptic(6);
    onChange(next);
  };

  function onKeyDown(event: KeyboardEvent, index: number) {
    const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + options.length) % options.length;
    choose(options[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-1 rounded-2xl border border-line bg-bg p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option, index) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => choose(option.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={`relative rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              checked ? "text-ember-ink" : "text-muted-2 hover:text-fg"
            }`}
          >
            {checked ? <motion.span layoutId={pill} className="absolute inset-0 rounded-xl bg-fg" transition={SNAPPY} /> : null}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
