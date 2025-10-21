// src/app/cart/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api-client";

type CartItem = {
  id: string;
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
};
type Cart = { id: string; items: CartItem[]; totalCents: number };

export default function CartPage() {
  const { token } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      const data = await apiClient<Cart>("/cart", { token });
      setCart(data);
    } catch (e: any) {
      alert(e.message ?? "Erreur chargement panier");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  async function setQty(itemId: string, quantity: number) {
    if (!token) return;
    try {
      const data = await apiClient<Cart>(`/cart/items/${itemId}`, {
        method: "PATCH",
        token,
        body: { quantity },
      });
      setCart(data);
    } catch (e: any) {
      alert(e.message ?? "Erreur maj quantité");
    }
  }

  async function remove(itemId: string) {
    if (!token) return;
    try {
      const data = await apiClient<{ cart: Cart }>(`/cart/items/${itemId}`, {
        method: "DELETE",
        token,
      });
      setCart(data.cart);
    } catch (e: any) {
      alert(e.message ?? "Erreur suppression");
    }
  }

  async function checkout() {
    if (!token) return;
    try {
      const r = await apiClient<{ orderId: string; clientSecret: string; paymentIntentId: string }>(
        "/checkout/start",
        {
          method: "POST",
          token,
          body: {
            addressLine: "12 rue de la République",
            city: "Paris",
            postalCode: "75001",
            phone: "+33601020304",
          },
        }
      );
      alert(`Commande ${r.orderId} créée.\nPI: ${r.paymentIntentId}\nclient_secret: ${r.clientSecret}`);
      // TO DO: intégration Stripe Elements ensuite
    } catch (e: any) {
      alert(e.message ?? "Erreur checkout (panier vide ?)");
    }
  }

  if (!token) {
    return <div className="text-neutral-400">Connecte-toi pour voir ton panier.</div>;
  }

  if (loading) {
    return <div className="text-neutral-400">Chargement du panier…</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-white mb-4">Ton panier</h1>
        <p className="text-neutral-400">Ton panier est vide.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white mb-6">Ton panier</h1>

      <div className="space-y-4">
        {cart.items.map((it) => (
          <div
            key={it.id}
            className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/40 p-4"
          >
            <div>
              <div className="text-white font-medium">{it.name}</div>
              <div className="text-neutral-400 text-sm">
                {(it.unitPriceCents / 100).toFixed(2)} € / unité
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="h-8 w-8 rounded-lg border border-neutral-700 text-white"
                onClick={() => setQty(it.id, Math.max(0, it.quantity - 1))}
              >
                −
              </button>
              <span className="w-8 text-center">{it.quantity}</span>
              <button
                className="h-8 w-8 rounded-lg border border-neutral-700 text-white"
                onClick={() => setQty(it.id, it.quantity + 1)}
              >
                +
              </button>

              <button
                className="ml-4 rounded-lg border border-red-700/60 text-red-300 px-3 py-1.5 hover:bg-red-900/20"
                onClick={() => remove(it.id)}
              >
                Retirer
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
        <div className="text-neutral-400">Total</div>
        <div className="text-white text-xl font-semibold">
          {(cart.totalCents / 100).toFixed(2)} €
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={checkout}
          className="rounded-xl bg-white text-black px-5 py-3 font-medium hover:opacity-90"
        >
          Passer au paiement
        </button>
      </div>
    </div>
  );
}