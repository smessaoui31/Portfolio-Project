"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { rateOrderAction } from "@/app/actions/order";
import { SNAPPY } from "@/components/motion/springs";
import { Button } from "@/components/ui/Button";
import { RATING_COMMENT_MAX, RATING_LABELS, type RatingScore } from "@/domain/ratings";
import { haptic } from "@/lib/haptics";

const SCORES: RatingScore[] = [1, 2, 3];

/** "Alors, c'était comment ?": one tap, an optional word, private to the pizzeria. */
export function RateOrder({ token, initial }: { token: string; initial: { score: number; comment: string | null } | null }) {
  const [score, setScore] = useState<RatingScore | null>(null);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(Boolean(initial));
  const [error, setError] = useState<string | null>(null);

  async function send(chosen: RatingScore, text?: string) {
    haptic(10);
    const result = await rateOrderAction(token, chosen, text);
    if (!result.ok && result.error !== "ALREADY_RATED") return setError("La note n'a pas pu être envoyée. Réessaie dans un instant.");
    setDone(true);
  }

  return (
    <section aria-labelledby="note" className="rounded-3xl border border-line-2 bg-surface p-6">
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.p key="merci" className="text-lg font-semibold" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SNAPPY}>
            Merci, c&apos;est noté.
          </motion.p>
        ) : (
          <motion.div key="note" exit={{ opacity: 0, y: -8 }}>
            <h2 id="note" className="text-lg font-semibold">
              Alors, c&apos;était comment ?
            </h2>
            <div className="mt-4 grid grid-cols-3 gap-2" role="group" aria-label="Ta note">
              {SCORES.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={score === s}
                  onClick={() => {
                    haptic(6);
                    setScore(s);
                  }}
                  className="rounded-2xl border border-line-2 py-3 font-semibold transition aria-pressed:border-ember aria-pressed:bg-ember aria-pressed:text-ember-ink"
                >
                  {RATING_LABELS[s]}
                </button>
              ))}
            </div>
            <AnimatePresence>
              {score ? (
                <motion.div className="mt-4 space-y-3" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={SNAPPY}>
                  <textarea
                    aria-label="Un mot pour les frères (facultatif)"
                    placeholder="Un mot pour les frères (facultatif)"
                    maxLength={RATING_COMMENT_MAX}
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full rounded-2xl border border-line-2 bg-bg px-4 py-3 text-sm"
                  />
                  <Button size="lg" className="w-full" onClick={() => send(score, comment)}>
                    Envoyer
                  </Button>
                </motion.div>
              ) : null}
            </AnimatePresence>
            {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
