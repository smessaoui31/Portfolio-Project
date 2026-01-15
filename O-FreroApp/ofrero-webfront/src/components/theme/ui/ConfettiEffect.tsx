// src/components/theme/ui/ConfettiEffect.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ConfettiEffectProps = {
  position: { x: number; y: number } | null;
  onComplete: () => void;
};

const colors = [
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
];

export default function ConfettiEffect({ position, onComplete }: ConfettiEffectProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !position) return null;

  return createPortal(
    <AnimatePresence>
      {position && (
        <div className="pointer-events-none fixed inset-0 z-[9998]">
          {[...Array(20)].map((_, i) => {
            const angle = (i * Math.PI * 2) / 20;
            const velocity = 150 + Math.random() * 100;
            const xVelocity = Math.cos(angle) * velocity;
            const yVelocity = Math.sin(angle) * velocity - 200; // Bias upward
            const rotation = Math.random() * 720 - 360;
            const size = 8 + Math.random() * 8;
            const color = colors[Math.floor(Math.random() * colors.length)];

            return (
              <motion.div
                key={i}
                initial={{
                  x: position.x,
                  y: position.y,
                  scale: 0,
                  rotate: 0,
                  opacity: 1,
                }}
                animate={{
                  x: position.x + xVelocity,
                  y: position.y + yVelocity + 500, // Gravity effect
                  scale: 1,
                  rotate: rotation,
                  opacity: 0,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.2,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                onAnimationComplete={() => {
                  if (i === 19) onComplete();
                }}
                className="absolute"
                style={{
                  width: size,
                  height: size,
                  backgroundColor: color,
                  borderRadius: Math.random() > 0.5 ? "50%" : "0%",
                }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
