"use client";

import { motion } from "motion/react";
import { ROLL } from "./springs";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function Digit({ value }: { value: number }) {
  return (
    <span className="relative inline-block h-[1.2em] overflow-hidden leading-[1.2em]">
      <span className="invisible">0</span>
      <motion.span className="absolute inset-x-0 top-0 flex flex-col" initial={false} animate={{ y: `${-value * 1.2}em` }} transition={ROLL}>
        {DIGITS.map((d) => (
          <span key={d} className="block h-[1.2em] text-center">
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/** Text whose digits roll like a counter when it changes (prices, counts). Screen readers get the plain text. */
export function Odometer({ value, className = "" }: { value: string; className?: string }) {
  const chars = [...value];
  return (
    <span className={`inline-flex tabular-nums ${className}`}>
      <span className="sr-only">{value}</span>
      <span aria-hidden className="inline-flex">
        {chars.map((char, index) => {
          // Keyed from the right, so units stay units when the number grows.
          const key = chars.length - index;
          return /\d/.test(char) ? <Digit key={key} value={Number(char)} /> : <span key={`${key}${char}`}>{char === " " ? " " : char}</span>;
        })}
      </span>
    </span>
  );
}
