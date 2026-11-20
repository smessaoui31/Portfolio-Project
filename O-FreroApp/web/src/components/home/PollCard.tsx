"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { voteAction } from "@/app/actions/polls";
import { haptic } from "@/lib/haptics";
import { formatParisDay } from "@/lib/time";
import type { PollView } from "@/server/polls";

const ERRORS = {
  SIGN_IN: "Connecte-toi pour voter.",
  NOT_FOUND: "Ce vote n'existe plus.",
  CLOSED: "Le vote est terminé.",
  ALREADY_VOTED: "Tu as déjà voté.",
} as const;

/** Vote for the next pizza of the moment; results appear once you voted, or when the vote ends. */
export function PollCard({ initial, signedIn }: { initial: PollView; signedIn: boolean }) {
  const [view, setView] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canVote = signedIn && !view.closed && !view.myCandidateId;

  async function vote(candidateId: string) {
    setBusy(true);
    setError(null);
    haptic([10, 30, 12]);
    const result = await voteAction(candidateId);
    setBusy(false);
    if (!result.ok) return setError(ERRORS[result.error]);
    if (result.view) setView(result.view);
  }

  return (
    <section aria-labelledby="vote" className="rounded-3xl border border-line-2 bg-surface p-6 md:p-8">
      <p className="text-[11px] uppercase tracking-[0.18em] text-ember">
        {view.closed ? "Résultat du vote" : `Vote ouvert jusqu'au ${formatParisDay(new Date(new Date(view.closesAt).getTime() - 1))}`}
      </p>
      <h2 id="vote" className="font-display mt-2 text-4xl md:text-5xl">
        {view.title}
      </h2>
      <ul className="mt-6 space-y-3">
        {view.candidates.map((c, index) => {
          const mine = view.myCandidateId === c.id;
          const winner = view.closed && index === 0;
          return (
            <li key={c.id} className="relative overflow-hidden rounded-2xl border border-line-2">
              {c.percent !== null ? (
                <motion.span
                  aria-hidden
                  className={`absolute inset-y-0 left-0 ${winner || mine ? "bg-ember/25" : "bg-surface-2"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${c.percent}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.1 + index * 0.08 }}
                />
              ) : null}
              <div className="relative flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {c.name}
                    {mine ? <span className="ml-2 text-xs font-normal text-ember">ton vote</span> : null}
                    {winner ? <span className="ml-2 text-xs font-normal text-ember">en tête</span> : null}
                  </p>
                  {c.description ? <p className="text-sm text-muted-2">{c.description}</p> : null}
                </div>
                {canVote ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => vote(c.id)}
                    className="rounded-xl bg-ember px-4 py-2 text-sm font-bold text-ember-ink disabled:opacity-40"
                  >
                    Voter
                  </button>
                ) : c.percent !== null ? (
                  <span className="font-semibold tabular-nums">{c.percent} %</span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {!signedIn && !view.closed ? (
        <p className="mt-4 text-sm text-muted-2">
          <Link href="/compte/connexion" className="font-semibold text-fg underline-offset-4 hover:underline">
            Connecte-toi pour voter
          </Link>
          , un vote par compte.
        </p>
      ) : null}
    </section>
  );
}
