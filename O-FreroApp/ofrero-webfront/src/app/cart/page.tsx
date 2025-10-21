"use client";
import { useCart } from "@/context/CartContext";
import { Trash2, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function CartPage() {
  const { cart, loading, error, update, remove } = useCart();

  const total = useMemo(() => cart?.totalCents ?? 0, [cart]);
  const items = cart?.items ?? [];

  if (loading && !cart) {
    return <div className="text-neutral-400">Chargement du panier…</div>;
  }
  if (error) {
    return <div className="text-red-400">Erreur : {error}</div>;
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Votre panier</h1>
        <p className="text-sm text-neutral-400">Modifiez vos articles avant de passer au paiement.</p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 p-8 text-center text-neutral-400">
          Votre panier est vide.{" "}
          <Link href="/" className="underline hover:text-white">Voir le menu</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* Liste des items */}
          <ul className="space-y-4">
            {items.map((it) => (
              <li key={it.id} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-lg bg-neutral-800 text-2xl">🍕</div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-white font-medium">{it.name}</h3>
                    <div className="text-white font-semibold">{(it.unitPriceCents / 100).toFixed(2)} €</div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      aria-label="Diminuer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                      onClick={() => update(it.id, Math.max(0, it.quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[36px] text-center">{it.quantity}</span>
                    <button
                      aria-label="Augmenter"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                      onClick={() => update(it.id, it.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>

                    <button
                      aria-label="Supprimer l'article"
                      className="ml-3 inline-flex h-8 items-center gap-2 rounded-md border border-red-800/50 px-2 text-red-300 hover:bg-red-900/20"
                      onClick={() => remove(it.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="text-sm">Retirer</span>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Récapitulatif */}
          <aside className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 h-fit">
            <h2 className="mb-4 text-white font-semibold">Résumé</h2>
            <div className="space-y-2 text-sm text-neutral-300">
              <div className="flex items-center justify-between">
                <span>Sous-total</span>
                <span>{(total / 100).toFixed(2)} €</span>
              </div>
              <div className="flex items-center justify-between text-neutral-500">
                <span>Livraison</span>
                <span>Calculée au paiement</span>
              </div>
            </div>

            <div className="my-4 h-px bg-neutral-800" />

            <div className="mb-4 flex items-center justify-between text-white font-semibold">
              <span>Total</span>
              <span>{(total / 100).toFixed(2)} €</span>
            </div>

            {/* À brancher sur /checkout/start plus tard */}
            <Link
              href="/checkout" // tu peux mettre une vraie page de checkout ensuite
              className="
                group relative inline-flex w-full items-center justify-center rounded-md
                border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-black
                transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(255,255,255,0.15)]
                active:translate-y-0
              "
            >
              Passer au paiement
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}