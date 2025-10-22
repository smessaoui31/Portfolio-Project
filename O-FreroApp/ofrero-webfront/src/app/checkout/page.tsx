// src/app/checkout/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Elements } from "@stripe/react-stripe-js";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import { stripePromise } from "@/lib/stripe";
import { apiAuthed } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import CheckoutPayment from "@/components/checkout/CheckoutPayment";

type StartCheckoutResponse = {
  orderId: string;
  clientSecret: string;
  paymentIntentId: string;
};

export default function CheckoutPage() {
  const { token } = useAuth();
  const { items = [], totalCents = 0, loading } = useCart();

  // Adresse (UI)
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");

  // Stripe
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  // UI
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const isEmpty = (items?.length ?? 0) === 0;

  async function handleStartCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) return setError("Veuillez vous connecter pour continuer.");
    if (isEmpty) return setError("Votre panier est vide.");
    if (!addressLine || !city || !postalCode || !phone) {
      return setError("Merci de renseigner tous les champs d'adresse.");
    }

    try {
      setSubmitting(true);

      // ✅ Respecte le schéma Zod backend: { address: {...} } (ou addressId)
      const data = await apiAuthed<StartCheckoutResponse>("/checkout/start", {
        method: "POST",
        body: JSON.stringify({
          address: {
            line1: addressLine,
            city,
            postalCode,
            phone,
            // line2 optionnelle si tu ajoutes un champ
          },
        }),
      });

      if (!data?.clientSecret || !data?.orderId) {
        throw new Error("Réponse inattendue du serveur (clientSecret ou orderId manquant).");
      }

      setClientSecret(data.clientSecret);
      setOrderId(data.orderId);

      try {
        (navigator as any)?.vibrate?.(15);
      } catch {}
    } catch (err: any) {
      console.error("[checkout] start error:", err);
      setError(err?.message || "Erreur lors du démarrage du paiement.");
    } finally {
      setSubmitting(false);
    }
  }

  const elementsOptions: StripeElementsOptions | undefined = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#ffffff",
            colorBackground: "#0a0a0a",
            colorText: "#ffffff",
            colorDanger: "#ef4444",
            borderRadius: "8px",
          },
        },
      }
    : undefined;

  if (loading) {
    return (
      <main className="min-h-[60vh] grid place-items-center text-neutral-400">
        Chargement du panier…
      </main>
    );
  }

  return (
    <main className="px-4 py-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Colonne paiement */}
        <section className="justify-self-center w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
          <h1 className="text-xl font-semibold text-white">Finaliser la commande</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Total à payer :{" "}
            <span className="font-medium text-white">{(totalCents / 100).toFixed(2)} €</span>
          </p>

          {!token && (
            <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              Vous devez être connecté(e) pour payer.{" "}
              <Link href="/login" className="underline hover:text-white">
                Se connecter
              </Link>
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          {!clientSecret && (
            <form onSubmit={handleStartCheckout} className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-neutral-300">Adresse</label>
                <input
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="12 rue de la République"
                  className="w-full min-w-0 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-neutral-700"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2 min-w-0">
                  <label className="text-sm text-neutral-300">Ville</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Paris"
                    className="w-full min-w-0 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-neutral-700"
                  />
                </div>
                <div className="space-y-2 min-w-0">
                  <label className="text-sm text-neutral-300">Code postal</label>
                  <input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="75001"
                    className="w-full min-w-0 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-neutral-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-neutral-300">Téléphone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full min-w-0 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-neutral-700"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || isEmpty || !token}
                className={`mt-2 inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition
                  ${
                    submitting || isEmpty || !token
                      ? "bg-white/60 text-black/70 cursor-not-allowed"
                      : "bg-white text-black hover:opacity-90"
                  }
                `}
              >
                {submitting ? "Démarrage…" : "Démarrer le paiement"}
              </button>
            </form>
          )}

          {/* Elements uniquement si clientSecret + orderId */}
          {clientSecret && orderId && elementsOptions && (
            <div className="mt-6">
              <Elements stripe={stripePromise} options={elementsOptions}>
                <CheckoutPayment orderId={orderId} />
              </Elements>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/menu"
              className="text-sm text-neutral-400 underline-offset-4 hover:text-white hover:underline"
            >
              ← Retour au menu
            </Link>
          </div>
        </section>

        {/* Colonne panier */}
        <aside className="justify-self-center lg:justify-self-stretch w-full max-w-xl lg:max-w-none rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
          <h2 className="text-white font-medium mb-3">Votre panier</h2>

          {isEmpty ? (
            <p className="text-neutral-400 text-sm">Panier vide.</p>
          ) : (
            <>
              <ul className="divide-y divide-neutral-800">
                {items.map((item) => (
                  <li key={item.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate text-sm text-white">{item.name}</div>
                      <div className="text-xs text-neutral-400">
                        {(item.unitPriceCents / 100).toFixed(2)} € × {item.quantity}
                      </div>
                    </div>
                    <div className="text-sm text-white font-medium">
                      {((item.unitPriceCents * item.quantity) / 100).toFixed(2)} €
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between border-t border-neutral-800 pt-3">
                <span className="text-neutral-400 text-sm">Total</span>
                <span className="text-white font-semibold">
                  {(totalCents / 100).toFixed(2)} €
                </span>
              </div>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}