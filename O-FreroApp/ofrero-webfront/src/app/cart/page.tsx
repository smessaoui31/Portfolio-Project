"use client";

import { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function CartPage() {
  const { cart, loading, refresh, update, remove } = useCart();

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  if (loading && !cart) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-neutral-400 text-sm animate-pulse">
        Chargement du panier…
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-semibold text-white mb-3">Votre panier</h1>
          <p className="text-neutral-400 mb-6">Votre panier est vide.</p>
          <Link
            href="/menu"
            className="inline-flex items-center justify-center rounded-md bg-white px-5 py-2.5 text-sm font-medium text-black hover:opacity-90 transition"
          >
            Voir le menu
          </Link>
        </motion.div>
      </main>
    );
  }

  const handleDec = (id: string, qty: number) => {
    const next = Math.max(qty - 1, 0);
    update(id, next).catch(() => {});
  };

  const handleInc = (id: string, qty: number) => {
    update(id, qty + 1).catch(() => {});
  };

  const handleRemove = (id: string) => {
    remove(id).catch(() => {});
  };

  const totalEuro = (cart.totalCents / 100).toFixed(2);

  return (
    <main className="relative mx-auto w-full max-w-5xl px-4 py-10">
      <motion.h1
        className="mb-8 text-3xl font-semibold text-white text-center md:text-left"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Votre panier
      </motion.h1>

      {/* Liste des articles */}
      <section className="space-y-4 mb-8">
        <AnimatePresence mode="popLayout">
          {cart.items.map((it) => (
            <motion.div
              key={it.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-[0_0_20px_rgba(255,255,255,0.02)] hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all duration-300"
            >
              <div className="flex-1">
                <h2 className="text-white font-medium text-lg">{it.name}</h2>
                <p className="text-sm text-neutral-400 mt-1">
                  {(it.unitPriceCents / 100).toFixed(2)} € / unité
                </p>
              </div>

              <div className="flex items-center gap-4">
                <motion.div
                  layout
                  className="flex items-center gap-3 rounded-lg border border-neutral-700 bg-neutral-950/40 px-3 py-1.5"
                >
                  <button
                    onClick={() => handleDec(it.id, it.quantity)}
                    className="h-9 w-9 flex items-center justify-center text-lg text-white hover:bg-neutral-800/70 active:scale-95 rounded-md transition-all"
                  >
                    −
                  </button>

                  <span className="min-w-[2rem] text-center text-white font-medium select-none">
                    {it.quantity}
                  </span>

                  <button
                    onClick={() => handleInc(it.id, it.quantity)}
                    className="h-9 w-9 flex items-center justify-center text-lg text-white hover:bg-neutral-800/70 active:scale-95 rounded-md transition-all"
                  >
                    +
                  </button>
                </motion.div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleRemove(it.id)}
                  className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800/60 transition"
                >
                  Supprimer
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      {/* Total + CTA aligné à droite */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
        className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-[0_0_25px_rgba(255,255,255,0.05)]"
      >
        <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
          <div className="text-right sm:text-left">
            <div className="text-neutral-300 text-sm uppercase tracking-wide mb-1">
              Total à payer
            </div>
            <div className="text-2xl font-semibold text-white">{totalEuro} €</div>
          </div>

          <Link
            href="/checkout"
            className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-black hover:opacity-90 transition-all duration-300 hover:-translate-y-0.5"
          >
            Passer au paiement →
          </Link>
        </div>
      </motion.div>
    </main>
  );
}