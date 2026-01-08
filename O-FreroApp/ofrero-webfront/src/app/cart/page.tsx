// src/app/cart/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Trash2, ShoppingBag, Pizza, UtensilsCrossed, Sparkles, ArrowRight, RotateCcw, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { id, items, totalCents, loading, error, reload, update, remove, clear } = useCart();
  const [removingId, setRemovingId] = useState<string | null>(null);

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
    <main className="mx-auto w-full max-w-5xl px-3 sm:px-4 py-4 sm:py-8">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800/60 ring-1 ring-neutral-700/50">
            <ShoppingCart className="h-5 w-5 text-neutral-400" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-white">Votre panier</h1>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading || isEmpty}
            onClick={() => clear().catch(() => {})}
            className={`group inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
              loading || isEmpty
                ? "cursor-not-allowed border-neutral-900 text-neutral-600"
                : "border-neutral-800 bg-neutral-900/50 text-neutral-200 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
            }`}
          >
            <Trash2 className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline">Vider</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95, rotate: -180 }}
            disabled={loading}
            onClick={() => reload().catch(() => {})}
            className="group inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-sm font-medium text-neutral-200 transition-all hover:border-neutral-700 hover:bg-neutral-800"
          >
            <RotateCcw className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
            <span className="hidden sm:inline">Recharger</span>
          </motion.button>
        </div>
      </motion.header>

      {error && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Panier vide */}
      {isEmpty ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl"
        >
          <div className="rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-900/80 to-neutral-900/40 p-8 md:p-12 text-center backdrop-blur-sm">
            {/* Icône animée */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-neutral-800/60 ring-4 ring-neutral-800/30"
            >
              <ShoppingBag className="h-12 w-12 text-neutral-500" strokeWidth={1.5} />
            </motion.div>

            {/* Titre */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl md:text-3xl font-bold text-white mb-3"
            >
              Votre panier est vide
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-neutral-400 mb-8 text-base md:text-lg"
            >
              Il est temps de vous faire plaisir avec nos délicieuses pizzas artisanales au feu de bois !
            </motion.p>

            {/* CTA principal */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8"
            >
              <Link
                href="/menu"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-black shadow-lg shadow-white/10 transition-all hover:scale-105 hover:shadow-xl hover:shadow-white/20 active:scale-100"
              >
                <Pizza className="h-5 w-5" />
                Découvrir nos pizzas
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>

            {/* Suggestions rapides */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <p className="flex items-center justify-center gap-2 text-sm text-neutral-500">
                <Sparkles className="h-4 w-4" />
                Nos suggestions
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Link
                  href="/menu?categoryId=pizza"
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-800/40 px-4 py-2 text-sm text-neutral-300 backdrop-blur-sm transition-all hover:border-neutral-600 hover:bg-neutral-800 hover:text-white"
                >
                  <Pizza className="h-3.5 w-3.5" />
                  Pizzas
                </Link>
                <Link
                  href="/menu?categoryId=boisson"
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-800/40 px-4 py-2 text-sm text-neutral-300 backdrop-blur-sm transition-all hover:border-neutral-600 hover:bg-neutral-800 hover:text-white"
                >
                  <UtensilsCrossed className="h-3.5 w-3.5" />
                  Boissons
                </Link>
                <Link
                  href="/menu?featured=true"
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 backdrop-blur-sm transition-all hover:border-emerald-500/60 hover:bg-emerald-500/20 hover:text-emerald-200"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Sélection du Chef
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_320px]">
          {/* Liste d'articles */}
          <section className="rounded-xl sm:rounded-2xl border border-neutral-800 bg-neutral-900/50">
            <AnimatePresence mode="popLayout">
              <ul className="divide-y divide-neutral-800">
                {items.map((it) => (
                  <motion.li
                    key={it.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-3 sm:p-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                      <div className="min-w-0 flex-1 w-full">
                        <div className="text-white font-medium truncate text-sm sm:text-base">{it.name}</div>
                        <div className="mt-1 text-sm text-neutral-400">
                          {(it.unitPriceCents / 100).toFixed(2)} € / unité
                        </div>

                        {it.cooking && (
                          <div className="mt-1 text-sm text-neutral-400">
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

                      <div className="shrink-0 w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:space-y-3">
                        {/* Prix total pour cet item */}
                        <div className="text-white font-semibold text-base sm:text-lg order-2 sm:order-1">
                          {((it.unitPriceCents * it.quantity) / 100).toFixed(2)} €
                        </div>

                        {/* Contrôles de quantité modernisés */}
                        <div className="inline-flex items-center gap-0.5 rounded-lg border border-neutral-700 bg-neutral-900/80 p-0.5 order-1 sm:order-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={loading || it.quantity <= 1}
                            onClick={() => update(it.id, Math.max(1, it.quantity - 1)).catch(() => {})}
                            className={`flex h-8 w-8 items-center justify-center rounded-md transition-all ${
                              loading || it.quantity <= 1
                                ? "cursor-not-allowed text-neutral-600"
                                : "text-neutral-200 hover:bg-neutral-800 active:bg-neutral-700"
                            }`}
                            aria-label="Diminuer la quantité"
                          >
                            <Minus className="h-4 w-4" strokeWidth={2.5} />
                          </motion.button>

                          <motion.span
                            key={it.quantity}
                            initial={{ scale: 1.2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex h-8 min-w-[2.5rem] items-center justify-center px-2 text-sm font-semibold text-white tabular-nums"
                          >
                            {it.quantity}
                          </motion.span>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={loading}
                            onClick={() => update(it.id, it.quantity + 1).catch(() => {})}
                            className={`flex h-8 w-8 items-center justify-center rounded-md transition-all ${
                              loading
                                ? "cursor-not-allowed text-neutral-600"
                                : "text-neutral-200 hover:bg-neutral-800 active:bg-neutral-700"
                            }`}
                            aria-label="Augmenter la quantité"
                          >
                            <Plus className="h-4 w-4" strokeWidth={2.5} />
                          </motion.button>
                        </div>

                        {/* Bouton supprimer amélioré */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={loading}
                          onClick={async () => {
                            setRemovingId(it.id);
                            try {
                              await remove(it.id);
                            } catch (e) {
                              console.error(e);
                            } finally {
                              setRemovingId(null);
                            }
                          }}
                          className="group flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-xs font-medium text-neutral-300 transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50 order-3"
                        >
                          <Trash2 className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                          <span className="sm:inline">Retirer</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </AnimatePresence>
          </section>

          {/* Récap / CTA */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl sm:rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 sm:p-5 h-fit lg:sticky lg:top-20"
          >
            <div className="space-y-4">
              {/* Résumé */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Articles</span>
                  <span className="text-neutral-300">{items.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Quantité totale</span>
                  <span className="text-neutral-300">
                    {items.reduce((sum, it) => sum + it.quantity, 0)}
                  </span>
                </div>
              </div>

              <div className="border-t border-neutral-800 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 text-base font-medium">Total</span>
                  <motion.span
                    key={totalCents}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-white text-2xl font-bold"
                  >
                    {(totalCents / 100).toFixed(2)} €
                  </motion.span>
                </div>
              </div>

              {/* Bouton paiement */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/checkout"
                  className="group flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-center text-base font-semibold text-black shadow-lg shadow-white/10 transition-all hover:shadow-xl hover:shadow-white/20"
                >
                  Procéder au paiement
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>

              {/* Lien retour */}
              <Link
                href="/menu"
                className="flex items-center justify-center gap-1.5 text-sm text-neutral-400 transition-colors hover:text-white"
              >
                <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                Continuer vos achats
              </Link>
            </div>
          </motion.aside>
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