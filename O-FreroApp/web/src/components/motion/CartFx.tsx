"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { create } from "zustand";

/** Where the flying pizza lands: the cart button in the header carries this attribute. */
export const CART_TARGET = "data-cart-target";

interface Point {
  x: number;
  y: number;
}

interface Burst {
  id: number;
  at: Point;
  sparks: { dx: number; dy: number; size: number; color: string; delay: number }[];
}

interface Flight {
  id: number;
  from: Point;
  to: Point;
  size: number;
  imageUrl: string | null;
}

interface CartFxState {
  bursts: Burst[];
  flights: Flight[];
  /** Increments each time something lands in the cart. */
  landed: number;
  burst: (at: Point) => void;
  fly: (from: DOMRect, imageUrl: string | null) => void;
  done: (kind: "bursts" | "flights", id: number) => void;
}

const EMBERS = ["#ff5a1f", "#ff8a3d", "#ffb347", "#ffd27a"];
let nextId = 1;

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const centerOf = (rect: DOMRect): Point => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });

export const useCartFx = create<CartFxState>()((set) => ({
  bursts: [],
  flights: [],
  landed: 0,
  burst: (at) => {
    if (reducedMotion()) return;
    const sparks = Array.from({ length: 14 }, (_, i) => {
      const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.5;
      const distance = 36 + Math.random() * 56;
      return {
        dx: Math.cos(angle) * distance,
        // Embers rise: the burst drifts upwards.
        dy: Math.sin(angle) * distance - 26,
        size: 3 + Math.random() * 4,
        color: EMBERS[i % EMBERS.length],
        delay: Math.random() * 0.06,
      };
    });
    set((s) => ({ bursts: [...s.bursts, { id: nextId++, at, sparks }] }));
  },
  fly: (from, imageUrl) => {
    const target = document.querySelector(`[${CART_TARGET}]`);
    const rect = target?.getBoundingClientRect();
    if (!rect || rect.width === 0 || reducedMotion()) {
      set((s) => ({ landed: s.landed + 1 }));
      return;
    }
    const size = Math.min(Math.max(from.width, 48), 104);
    set((s) => ({ flights: [...s.flights, { id: nextId++, from: centerOf(from), to: centerOf(rect), size, imageUrl }] }));
  },
  done: (kind, id) =>
    set((s) =>
      kind === "flights"
        ? { flights: s.flights.filter((f) => f.id !== id), landed: s.landed + 1 }
        : { bursts: s.bursts.filter((b) => b.id !== id) },
    ),
}));

/** A stylised pizza used while products have no photo. */
function PizzaToken({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r="31" fill="#c9772f" />
      <circle cx="32" cy="32" r="25" fill="#d8401c" />
      <circle cx="32" cy="32" r="22" fill="#f3d38a" opacity="0.9" />
      {[
        [22, 24],
        [40, 22],
        [30, 38],
        [44, 38],
        [20, 40],
        [34, 27],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.6" fill="#a8301a" />
      ))}
      <circle cx="27" cy="31" r="1.6" fill="#3d6b2a" />
      <circle cx="39" cy="31" r="1.6" fill="#3d6b2a" />
    </svg>
  );
}

function FlightView({ flight }: { flight: Flight }) {
  const done = useCartFx((s) => s.done);
  const half = flight.size / 2;
  const peak = Math.min(flight.from.y, flight.to.y) - 140;
  const midX = flight.from.x + (flight.to.x - flight.from.x) * 0.35;
  return (
    <motion.div
      className="fixed top-0 left-0 overflow-hidden rounded-full shadow-[0_12px_30px_-8px_rgba(255,90,31,0.7)]"
      style={{ width: flight.size, height: flight.size }}
      initial={{ x: flight.from.x - half, y: flight.from.y - half, scale: 1, rotate: 0 }}
      animate={{
        x: [flight.from.x - half, midX - half, flight.to.x - half],
        y: [flight.from.y - half, peak - half, flight.to.y - half],
        scale: [1, 0.75, 0.18],
        rotate: [0, 200, 400],
      }}
      transition={{ duration: 0.85, times: [0, 0.42, 1], ease: [0.5, 0, 0.25, 1] }}
      onAnimationComplete={() => done("flights", flight.id)}
    >
      {flight.imageUrl ? (
        <Image src={flight.imageUrl} alt="" width={flight.size} height={flight.size} className="size-full object-cover" />
      ) : (
        <PizzaToken size={flight.size} />
      )}
    </motion.div>
  );
}

function BurstView({ burst }: { burst: Burst }) {
  const done = useCartFx((s) => s.done);
  return (
    <div className="fixed top-0 left-0" style={{ transform: `translate(${burst.at.x}px, ${burst.at.y}px)` }}>
      {burst.sparks.map((spark, index) => (
        <motion.span
          key={index}
          className="absolute rounded-full"
          style={{
            width: spark.size,
            height: spark.size,
            marginLeft: -spark.size / 2,
            marginTop: -spark.size / 2,
            background: spark.color,
            boxShadow: `0 0 8px 1px ${spark.color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: spark.dx, y: spark.dy, opacity: 0, scale: 0.2 }}
          transition={{ duration: 0.65, delay: spark.delay, ease: [0.15, 0.7, 0.3, 1] }}
          onAnimationComplete={index === 0 ? () => done("bursts", burst.id) : undefined}
        />
      ))}
    </div>
  );
}

/** Fixed layer above everything: ember bursts and pizzas flying to the cart. */
export function CartFxLayer() {
  const reduce = useReducedMotion();
  const bursts = useCartFx((s) => s.bursts);
  const flights = useCartFx((s) => s.flights);
  if (reduce) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[70]" aria-hidden>
      {bursts.map((b) => (
        <BurstView key={b.id} burst={b} />
      ))}
      {flights.map((f) => (
        <FlightView key={f.id} flight={f} />
      ))}
    </div>
  );
}
