"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useCart } from "@/components/cart/cart-store";
import { buttonClasses } from "@/components/ui/Button";
import { STATUS_LABELS, TERMINAL_STATUSES } from "@/domain/order-status";
import { COOKING_LABELS } from "@/domain/types";
import { formatEuros } from "@/lib/money";
import { SITE } from "@/lib/site";
import { formatParisDay, formatParisTime, parisDateKey } from "@/lib/time";
import type { TrackingView as View } from "@/server/lifecycle";
import { LAST_EMAIL_KEY } from "./types";

const subscribeNoop = () => () => {};
const readLastEmail = () => {
  try {
    return sessionStorage.getItem(LAST_EMAIL_KEY);
  } catch {
    return null;
  }
};

export function TrackingView({
  token,
  initial,
  fresh,
  paid,
  paymentFailed = false,
}: {
  token: string;
  initial: View;
  fresh: boolean;
  paid: boolean;
  paymentFailed?: boolean;
}) {
  const [view, setView] = useState(initial);
  const clear = useCart((s) => s.clear);
  const lastEmail = useSyncExternalStore(subscribeNoop, readLastEmail, () => null);

  useEffect(() => {
    if (paid) clear();
  }, [paid, clear]);

  useEffect(() => {
    if (TERMINAL_STATUSES.includes(view.status)) return;
    const id = setInterval(async () => {
      const res = await fetch(`/api/suivi/${token}`, { cache: "no-store" });
      if (res.ok) setView(await res.json());
    }, 10_000);
    return () => clearInterval(id);
  }, [token, view.status]);

  const slot = new Date(view.slotAt);
  const today = parisDateKey(new Date()) === parisDateKey(slot);
  const number = String(view.number).padStart(4, "0");
  const ended = view.status === "CANCELLED" || view.status === "FAILED";

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{SITE.name}</span>
        <span className="tabular-nums">Commande n°{number}</span>
      </div>

      {fresh && !ended ? <p className="text-lg text-fg">Merci {view.firstName}, c&apos;est dans le four bientôt.</p> : null}

      {ended ? (
        <section>
          <h1 className="font-display text-6xl">{STATUS_LABELS[view.status]}</h1>
          <p className="mt-4 text-muted-2">
            Cette commande ne sera pas préparée. Une question ? Appelle-nous au{" "}
            <a href={SITE.phoneHref} className="font-semibold text-fg underline-offset-4 hover:underline">
              {SITE.phoneDisplay}
            </a>
            .
          </p>
        </section>
      ) : view.status === "PENDING_PAYMENT" && paymentFailed ? (
        <section>
          <h1 className="font-display text-5xl">Paiement non abouti</h1>
          <p className="mt-4 text-muted-2">Ta banque a refusé ou interrompu le paiement. Ton panier est toujours là : tu peux réessayer.</p>
          <Link href="/commande" className={buttonClasses("primary", "lg", "mt-6")}>
            Réessayer
          </Link>
        </section>
      ) : view.status === "PENDING_PAYMENT" ? (
        <section aria-live="polite">
          <h1 className="font-display text-5xl">Paiement en cours</h1>
          <p className="mt-4 text-muted-2">
            On attend la confirmation de ta banque, la page se met à jour toute seule. Sans confirmation d&apos;ici 30 minutes, la
            commande est annulée et rien n&apos;est débité.
          </p>
        </section>
      ) : (
        <section aria-live="polite">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
            {view.mode === "PICKUP" ? "Prête à" : "Livraison vers"}
            {today ? "" : ` · ${formatParisDay(slot)}`}
          </p>
          <p className="font-display mt-1 text-[6.5rem] leading-[0.85] text-ember tabular-nums md:text-[9rem]">
            {formatParisTime(slot)}
          </p>
          <p className="mt-3 text-muted-2">
            {view.mode === "PICKUP" ? `${SITE.address}` : view.addressShort} ·{" "}
            {view.paymentMethod === "AT_PICKUP" ? "à régler sur place" : "payée en ligne"}
          </p>

          <ol className="mt-8 grid grid-cols-4 gap-1.5">
            {view.steps.map((s) => (
              <li key={s.status}>
                <div className={`h-1.5 rounded-full ${s.done ? "bg-ember" : "bg-surface-2"}`} />
                <p className={`mt-2 text-[10px] uppercase tracking-[0.1em] ${s.done ? "text-fg" : "text-muted"}`}>{s.label}</p>
              </li>
            ))}
          </ol>
          {view.status === "NOT_COLLECTED" ? <p className="mt-4 text-sm text-muted-2">Commande non récupérée.</p> : null}
        </section>
      )}

      {view.isGuest && fresh && view.stamps > 0 && !ended ? (
        <section className="rounded-3xl bg-fg p-6 text-ember-ink">
          <p className="text-lg font-bold">
            Cette commande vaut {view.stamps} tampon{view.stamps > 1 ? "s" : ""}
          </p>
          <p className="mt-2 text-sm">
            Crée ton compte (ou connecte-toi) avec la même adresse e-mail pour les garder, collectionner les éditions et recommander
            en un geste.
          </p>
          <div className="mt-4 flex gap-1.5" aria-hidden>
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className={`size-5 rounded-full ${i < view.stamps ? "bg-ember" : "border-[1.5px] border-dashed border-[#b9a58f]"}`} />
            ))}
          </div>
          <Link
            href={`/compte/inscription${lastEmail ? `?email=${encodeURIComponent(lastEmail)}` : ""}`}
            className={buttonClasses("primary", "lg", "mt-5 w-full !bg-ember-ink !text-fg")}
          >
            Garder mes tampons
          </Link>
        </section>
      ) : null}

      <section>
        <h2 className="text-xs uppercase tracking-[0.16em] text-muted">Détail</h2>
        <ul className="mt-3 divide-y divide-line border-y border-line text-sm">
          {view.items.map((item, i) => (
            <li key={i} className="py-3">
              <span className="font-semibold">
                {item.quantity} × {item.name}
              </span>
              {item.isReward ? <span className="ml-2 text-xs text-ember">dont 1 offerte</span> : null}
              <span className="block text-xs text-muted">
                {[COOKING_LABELS[item.cooking], ...item.supplements.map((s) => `+ ${s}`)].join(" · ")}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatEuros(view.totalCents)}</span>
        </div>
      </section>

      <a href={SITE.phoneHref} className={buttonClasses("secondary", "lg", "w-full")}>
        Une question ? Appeler {SITE.phoneDisplay}
      </a>
    </div>
  );
}
