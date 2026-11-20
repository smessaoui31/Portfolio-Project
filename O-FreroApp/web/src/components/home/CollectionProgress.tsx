"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const SEEN = "ofrero-collection-seen";

function readSeen(): string[] {
  try {
    const raw = window.localStorage.getItem(SEEN);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/** "X éditions goûtées sur Y", celebrating editions added since the last visit. */
export function CollectionProgress({ tastedIds, total }: { tastedIds: string[]; total: number }) {
  const [fresh, setFresh] = useState(0);
  useEffect(() => {
    const seen = readSeen();
    const added = tastedIds.filter((id) => !seen.includes(id));
    try {
      window.localStorage.setItem(SEEN, JSON.stringify([...new Set([...seen, ...tastedIds])]));
    } catch {
      // Storage unavailable: no celebration, nothing else changes.
    }
    if (added.length === 0) return;
    const show = window.setTimeout(() => setFresh(added.length), 300);
    const hide = window.setTimeout(() => setFresh(0), 3800);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [tastedIds]);

  const tasted = Math.min(tastedIds.length, total);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-sm text-muted-2">
        <span className="font-display text-2xl text-fg">{tasted}</span> édition{tasted > 1 ? "s" : ""} goûtée{tasted > 1 ? "s" : ""} sur{" "}
        {total}
      </p>
      <AnimatePresence>
        {fresh > 0 ? (
          <motion.span
            className="rounded-full bg-ember px-3 py-1 text-xs font-bold text-ember-ink"
            initial={{ scale: 0.4, opacity: 0, y: 6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 18 }}
          >
            {fresh > 1 ? `${fresh} nouvelles dans ta collection` : "Nouvelle dans ta collection"}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
