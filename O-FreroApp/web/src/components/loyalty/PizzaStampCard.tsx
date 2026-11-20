"use client";

import { motion } from "motion/react";

const SIZE = 220;
const C = SIZE / 2;
const R = SIZE / 2 - 8;

function point(angle: number, radius: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: C + radius * Math.cos(rad), y: C + radius * Math.sin(rad) };
}

function wedge(index: number, total: number, radius: number): string {
  const start = -90 + (index * 360) / total;
  const end = start + 360 / total;
  const a = point(start, radius);
  const b = point(end, radius);
  return `M ${C} ${C} L ${a.x} ${a.y} A ${radius} ${radius} 0 0 1 ${b.x} ${b.y} Z`;
}

/** Toppings placed in the middle of a slice. */
function toppings(index: number, total: number) {
  const mid = -90 + ((index + 0.5) * 360) / total;
  return [0.42, 0.68].map((ratio, i) => ({ ...point(mid + (i ? 6 : -5), R * ratio), key: i }));
}

/** The stamp card as a pizza: one slice per stamp, garnished as stamps are earned. */
export function PizzaStampCard({ filled, total }: { filled: number; total: number }) {
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-[240px]" role="img" aria-label={`${filled} tampons sur ${total}`}>
      <circle cx={C} cy={C} r={R + 6} fill="#c9772f" />
      <circle cx={C} cy={C} r={R} fill="#2a211b" />
      {Array.from({ length: total }, (_, i) => {
        const on = i < filled;
        const reward = i === total - 1;
        return (
          <g key={i}>
            <path d={wedge(i, total, R)} fill="none" stroke="#3a2e25" strokeWidth="1.5" strokeDasharray={on ? undefined : "4 4"} />
            {on ? (
              <motion.g
                style={{ originX: `${C}px`, originY: `${C}px` }}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 22, delay: 0.15 + i * 0.07 }}
              >
                <path d={wedge(i, total, R - 2)} fill="#d8401c" />
                <path d={wedge(i, total, R - 9)} fill="#f3d38a" />
                {toppings(i, total).map((t) => (
                  <circle key={t.key} cx={t.x} cy={t.y} r="4.5" fill="#a8301a" />
                ))}
              </motion.g>
            ) : reward ? (
              <text {...point(-90 + ((i + 0.5) * 360) / total, R * 0.6)} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill="#ff5a1f">
                OFFERTE
              </text>
            ) : null}
          </g>
        );
      })}
      <circle cx={C} cy={C} r="5" fill="#c9772f" />
    </svg>
  );
}
