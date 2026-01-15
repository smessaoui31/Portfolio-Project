// src/components/theme/ui/PullToRefresh.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

type PullToRefreshProps = {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
};

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const threshold = 80; // Distance minimale pour déclencher le refresh

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Seulement si on est en haut de la page
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        setCanPull(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!canPull || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - startY.current;

      // Seulement si on tire vers le bas
      if (distance > 0) {
        // Résistance progressive
        const resistedDistance = Math.min(distance / 2, 120);
        setPullDistance(resistedDistance);

        // Empêcher le scroll si on tire
        if (distance > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!canPull || isRefreshing) return;

      if (pullDistance > threshold) {
        setIsRefreshing(true);
        setPullDistance(threshold);

        try {
          await onRefresh();
        } catch (error) {
          console.error("Refresh error:", error);
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }

      setCanPull(false);
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [canPull, isRefreshing, pullDistance, onRefresh]);

  const rotation = (pullDistance / threshold) * 360;
  const opacity = Math.min(pullDistance / threshold, 1);

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <AnimatePresence>
        {pullDistance > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              height: pullDistance,
            }}
            className="absolute left-0 right-0 top-0 z-50 flex items-center justify-center overflow-hidden"
          >
            <motion.div
              style={{
                rotate: isRefreshing ? undefined : rotation,
                opacity: opacity,
              }}
              animate={
                isRefreshing
                  ? {
                      rotate: 360,
                      transition: {
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      },
                    }
                  : {}
              }
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg"
            >
              <RefreshCw className="h-5 w-5 text-black" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </div>
  );
}
