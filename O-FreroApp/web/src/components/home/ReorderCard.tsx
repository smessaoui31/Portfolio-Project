"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { reorderAction } from "@/app/actions/account";
import { checkLinesAction, quoteCartAction } from "@/app/actions/cart";
import { useCart } from "@/components/cart/cart-store";
import { SNAPPY } from "@/components/motion/springs";
import { Button } from "@/components/ui/Button";
import { forgetLastOrder, markReorder, readLastOrder } from "@/lib/device-storage";
import { haptic } from "@/lib/haptics";
import { formatEuros } from "@/lib/money";

const subscribe = () => () => {};

/** "Ta dernière commande · Recommander": from this phone first, else from the account. */
export function ReorderCard({ account }: { account: { orderId: string; summary: string } | null }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const [forgotten, setForgotten] = useState(false);
  const [busy, setBusy] = useState(false);
  const [skipped, setSkipped] = useState<string[] | null>(null);
  const [totalCents, setTotalCents] = useState<number | null>(null);

  const last = useMemo(() => (hydrated && !forgotten ? readLastOrder() : null), [hydrated, forgotten]);
  const summary = last
    ? last.lines.map((l) => [`${l.quantity} × ${l.name}`, ...(l.choiceNames ?? [])].join(" · ")).join(", ")
    : account?.summary ?? null;

  useEffect(() => {
    if (!last) return;
    let alive = true;
    quoteCartAction(last.lines).then((q) => {
      if (alive && q.ok) setTotalCents(q.quote.subtotalCents);
    });
    return () => {
      alive = false;
    };
  }, [last]);

  if (!hydrated || !summary || forgotten) return null;

  async function reorder() {
    setBusy(true);
    haptic(10);
    const result = last ? await checkLinesAction(last.lines) : account ? await reorderAction(account.orderId) : null;
    setBusy(false);
    if (!result) return;
    result.lines.forEach((line) => add(line));
    markReorder();
    if (result.skipped.length === 0) router.push("/commande");
    else setSkipped(result.skipped);
  }

  return (
    <motion.section
      aria-label="Ta dernière commande"
      className="mx-auto max-w-6xl px-4 pt-4 md:px-6"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SNAPPY}
    >
      <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-line-2 bg-surface px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Ta dernière commande</p>
          <p className="mt-1 truncate text-sm text-fg">{summary}</p>
          {last ? (
            <button
              type="button"
              className="mt-1 text-xs text-muted-2 underline-offset-4 hover:text-fg hover:underline"
              onClick={() => {
                forgetLastOrder();
                setForgotten(true);
              }}
            >
              Oublier ces informations
            </button>
          ) : null}
        </div>
        <Button size="lg" onClick={reorder} disabled={busy} className="shrink-0">
          <span>Recommander</span>
          {totalCents !== null ? <span className="tabular-nums opacity-80">{formatEuros(totalCents)}</span> : null}
        </Button>
        <AnimatePresence>
          {skipped ? (
            <motion.p className="w-full text-sm text-muted-2" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
              Plus disponible : {skipped.join(", ")}.{" "}
              <button type="button" className="font-semibold text-fg underline-offset-4 hover:underline" onClick={() => router.push("/commande")}>
                Continuer avec le reste
              </button>
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
