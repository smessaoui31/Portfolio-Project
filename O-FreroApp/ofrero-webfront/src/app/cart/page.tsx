// src/app/cart/page.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { id, items, totalCents, loading, error, reload, update, remove, clear } = useCart();

  useEffect(() => {
    reload().catch(() => {});
  }, []);

  const isEmpty = (items?.length ?? 0) === 0;

  if (loading && !id) {
    return (
      <main className="min-h-[60vh] grid place-items-center text-neutral-400">
        Chargement du panier…
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Votre panier</h1>
        <div className="flex items-center gap-2">
          <button
            disabled={loading || isEmpty}
            onClick={() => clear().catch(() => {})}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              loading || isEmpty
                ? "cursor-not-allowed border-neutral-900 text-neutral-600"
                : "border-neutral-800 text-neutral-200 hover:bg-neutral-800/60"
            }`}
          >
            Vider
          </button>
          <button
            disabled={loading}
            onClick={() => reload().catch(() => {})}
            className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800/60"
          >
            Recharger
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Panier vide */}
      {isEmpty ? (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 text-neutral-400">
          Votre panier est vide.{" "}
          <Link href="/menu" className="underline underline-offset-4 hover:text-white">
            Parcourir le menu
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Liste d’articles */}
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900/50">
            <ul className="divide-y divide-neutral-800">
              {items.map((it) => (
                <li key={it.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-white font-medium truncate">{it.name}</div>
                      <div className="mt-1 text-xm text-neutral-400">
                        {(it.unitPriceCents / 100).toFixed(2)} € / unité
                      </div>

                      {it.cooking && (
                        <div className="mt-1 text-xm text-neutral-400">
                          Cuisson : <span className="text-neutral-300">{labelCooking(it.cooking)}</span>
                        </div>
                      )}
                      {Array.isArray(it.supplements) && it.supplements.length > 0 && (
                        <div className="mt-1 text-xs text-neutral-400">
                          Suppléments :
                          <ul className="mt-1 list-disc pl-4">
                            {it.supplements.map((s) => (
                              <li key={s.id} className="text-neutral-300">
                                {s.name} (+{(s.unitPriceCents / 100).toFixed(2)} €)
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-white font-semibold">
                        {((it.unitPriceCents * it.quantity) / 100).toFixed(2)} €
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-neutral-800">
                        <button
                          disabled={loading || it.quantity <= 1}
                          onClick={() => update(it.id, Math.max(1, it.quantity - 1)).catch(() => {})}
                          className={`px-2 py-1 text-sm ${
                            loading || it.quantity <= 1
                              ? "cursor-not-allowed text-neutral-600"
                              : "text-neutral-200 hover:bg-neutral-800/60"
                          }`}
                          aria-label="Diminuer la quantité"
                        >
                          −
                        </button>
                        <span className="px-3 py-1 text-sm text-white tabular-nums">{it.quantity}</span>
                        <button
                          disabled={loading}
                          onClick={() => update(it.id, it.quantity + 1).catch(() => {})}
                          className="px-2 py-1 text-sm text-neutral-200 hover:bg-neutral-800/60"
                          aria-label="Augmenter la quantité"
                        >
                          +
                        </button>
                      </div>
                      <div>
                        <button
                          disabled={loading}
                          onClick={() => remove(it.id).catch(() => {})}
                          className="mt-2 w-full rounded-md border border-neutral-800 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800/60"
                        >
                          Retirer
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Récap / CTA */}
          <aside className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 h-fit">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 text-sm">Total</span>
              <span className="text-white text-lg font-semibold">
                {(totalCents / 100).toFixed(2)} €
              </span>
            </div>

            <Link
              href="/checkout"
              className="mt-4 block rounded-md bg-white px-4 py-2 text-center text-sm font-medium text-black hover:opacity-90"
            >
              Procéder au paiement
            </Link>

            <Link
              href="/menu"
              className="mt-2 block text-center text-sm text-neutral-400 underline-offset-4 hover:text-white hover:underline"
            >
              ← Continuer vos achats
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}

function labelCooking(c: "NORMAL" | "WELL_DONE" | "EXTRA_CRISPY") {
  switch (c) {
    case "WELL_DONE":
      return "Bien cuite";
    case "EXTRA_CRISPY":
      return "Extra croustillante";
    default:
      return "Normale";
  }
}