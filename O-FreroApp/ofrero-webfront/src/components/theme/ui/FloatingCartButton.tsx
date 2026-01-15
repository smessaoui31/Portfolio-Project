// src/components/theme/ui/FloatingCartButton.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useEffect, useState, useRef } from "react";

export default function FloatingCartButton() {
  const pathname = usePathname();
  const { items } = useCart();
  const [isVisible, setIsVisible] = useState(false);
  const [prevCount, setPrevCount] = useState(0);
  const [shouldPulse, setShouldPulse] = useState(false);

  const count = items.reduce((sum, it) => sum + it.quantity, 0);

  // Show/hide based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Pulse when count changes
  useEffect(() => {
    if (count > prevCount) {
      setShouldPulse(true);
      setTimeout(() => setShouldPulse(false), 600);
    }
    setPrevCount(count);
  }, [count, prevCount]);

  // Hide on cart page
  if (pathname === "/cart" || pathname === "/checkout") {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && count > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 100 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 100 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 z-40 md:hidden"
        >
          <Link
            href="/cart"
            className="group relative flex h-14 w-14 items-center justify-center rounded-full border border-neutral-700 bg-white shadow-2xl shadow-black/40 transition-all hover:scale-110 active:scale-95"
          >
            {/* Pulsing ring effect */}
            {shouldPulse && (
              <>
                <motion.span
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 rounded-full border-2 border-emerald-500"
                />
                <motion.span
                  initial={{ scale: 1, opacity: 0.4 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="absolute inset-0 rounded-full border-2 border-emerald-400"
                />
              </>
            )}

            <ShoppingCart className="h-6 w-6 text-black transition-transform group-hover:scale-110" />

            {/* Badge */}
            <motion.span
              key={count}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shadow-lg ring-2 ring-white"
            >
              {count}
            </motion.span>

            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
