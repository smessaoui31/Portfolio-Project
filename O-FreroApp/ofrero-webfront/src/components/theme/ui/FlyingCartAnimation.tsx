// src/components/theme/ui/FlyingCartAnimation.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

type FlyingCartAnimationProps = {
  startPosition: { x: number; y: number } | null;
  endPosition: { x: number; y: number } | null;
  productImage?: string;
  onComplete: () => void;
};

export default function FlyingCartAnimation({
  startPosition,
  endPosition,
  productImage,
  onComplete,
}: FlyingCartAnimationProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !startPosition || !endPosition) return null;

  const distance = Math.sqrt(
    Math.pow(endPosition.x - startPosition.x, 2) +
    Math.pow(endPosition.y - startPosition.y, 2)
  );

  const duration = Math.min(0.8, Math.max(0.4, distance / 1000));

  return createPortal(
    <AnimatePresence>
      {startPosition && endPosition && (
        <motion.div
          initial={{
            x: startPosition.x,
            y: startPosition.y,
            scale: 1,
            opacity: 1,
          }}
          animate={{
            x: endPosition.x,
            y: endPosition.y,
            scale: 0.3,
            opacity: 0.8,
          }}
          exit={{
            scale: 0,
            opacity: 0,
          }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
            duration: duration,
          }}
          onAnimationComplete={onComplete}
          className="pointer-events-none fixed z-[9999]"
          style={{
            width: "80px",
            height: "80px",
          }}
        >
          <div className="relative h-full w-full">
            {/* Cercle de fond avec glow */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.6, 0.3, 0.6],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full bg-white/20 blur-xl"
            />

            {/* Image du produit ou icône par défaut */}
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-white/40 bg-white shadow-2xl">
              {productImage ? (
                <img
                  src={productImage}
                  alt="Product"
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg
                  className="h-10 w-10 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              )}
            </div>

            {/* Particules qui suivent */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * Math.PI * 2) / 3) * 20,
                  y: Math.sin((i * Math.PI * 2) / 3) * 20,
                  opacity: [1, 0.5, 0],
                }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.1,
                  repeat: 2,
                }}
                className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
