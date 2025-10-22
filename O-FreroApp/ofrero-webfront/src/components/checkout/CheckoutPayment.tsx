// src/components/checkout/CheckoutPayment.tsx
"use client";

import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import Link from "next/link";

export default function CheckoutPayment() {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!stripe || !elements) return;

    setSubmitting(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: typeof window !== "undefined" ? `${window.location.origin}/checkout/success` : "",
      },
      redirect: "if_required",
    });

    setSubmitting(false);

    if (error) {
      setErr(error.message ?? "Paiement refusé");
      return;
    }

    // si pas de redirection (car paiement immédiat), on redirige manuellement
    window.location.href = "/checkout/success";
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement />
      {err && <p className="text-red-400 text-sm">{err}</p>}

      <div className="flex items-center justify-end gap-3">
        <Link
          href="/cart"
          className="rounded-md border border-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800/60"
        >
          Retour au panier
        </Link>
        <button
          type="submit"
          disabled={!stripe || submitting}
          className="group relative inline-flex items-center justify-center
                     rounded-md border border-neutral-700 bg-white text-black
                     px-5 py-2.5 text-sm font-medium shadow-sm
                     transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
        >
          {submitting ? "Paiement..." : "Payer maintenant"}
        </button>
      </div>
    </form>
  );
}