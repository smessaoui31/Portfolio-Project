"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { haptic } from "@/lib/haptics";

/** The account's referral link, shared natively on phones or copied elsewhere. */
export function ReferralCard({ code, friends, stampsEarned }: { code: string; friends: number; stampsEarned: number }) {
  const [copied, setCopied] = useState(false);

  async function invite() {
    haptic(10);
    const url = `${window.location.origin}/?parrain=${code}`;
    const text = "Je te fais découvrir O'Frero Pizza : un tampon offert à ta première commande à emporter.";
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "O'Frero Pizza", text, url });
        return;
      } catch {
        // Cancelled or refused: fall back to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie ce lien :", url);
    }
  }

  return (
    <div className="rounded-3xl border border-line-2 bg-surface p-6">
      <p className="text-sm text-muted-2">
        Un tampon pour toi et un pour ton ami, dès qu&apos;il récupère sa première commande à emporter.
      </p>
      <p className="mt-4 font-display text-4xl tracking-wider">{code}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={invite}>
          Inviter un ami
        </Button>
        <AnimatePresence>
          {copied ? (
            <motion.span className="text-sm text-ok" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              Lien copié
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
      <p className="mt-4 text-sm text-muted">
        {friends} ami{friends > 1 ? "s" : ""} parrainé{friends > 1 ? "s" : ""} · {stampsEarned} tampon{stampsEarned > 1 ? "s" : ""} gagné
        {stampsEarned > 1 ? "s" : ""}
      </p>
    </div>
  );
}
