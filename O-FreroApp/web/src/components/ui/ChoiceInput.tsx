"use client";

import { AnimatePresence, motion } from "motion/react";
import { POP } from "@/components/motion/springs";

/** Native radio or checkbox (accessible, clickable) with an animated mark: a popping dot or a tick that draws itself. */
export function ChoiceInput({
  type,
  name,
  checked,
  onChange,
}: {
  type: "radio" | "checkbox";
  name?: string;
  checked: boolean;
  onChange: () => void;
}) {
  const shape = type === "radio" ? "rounded-full" : "rounded-md checked:bg-ember";
  return (
    <span className="relative grid size-5 shrink-0 place-items-center">
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className={`absolute inset-0 m-0 cursor-pointer appearance-none border-2 border-line-2 transition-colors checked:border-ember ${shape}`}
      />
      <AnimatePresence initial={false}>
        {checked && type === "radio" ? (
          <motion.span
            key="dot"
            className="pointer-events-none size-2.5 rounded-full bg-ember"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={POP}
          />
        ) : null}
        {checked && type === "checkbox" ? (
          <motion.svg key="tick" viewBox="0 0 16 16" className="pointer-events-none relative size-3.5 text-ember-ink" aria-hidden>
            <motion.path
              d="M3 8.5l3.2 3L13 4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              exit={{ pathLength: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            />
          </motion.svg>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
