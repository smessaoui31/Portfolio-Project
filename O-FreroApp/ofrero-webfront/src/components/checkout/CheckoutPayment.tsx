// src/components/checkout/CheckoutPayment.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

export default function CheckoutPayment({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!stripe || !elements) return;

    try {
      setSubmitting(true);

      // 1) Tente le paiement sans redirection si possible
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        // 2) Si Stripe DOIT rediriger (3DS, etc.), on lui donne un return_url qui contient l'orderId
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?orderId=${orderId}`,
        },
      });

      if (confirmError) {
        // Erreurs "connues" Stripe Elements
        setError(confirmError.message || "Le paiement a échoué. Merci de réessayer.");
        return;
      }

      // 3) Si pas de redirect requis et que le paiement est OK, on redirige nous-mêmes
      if (paymentIntent && paymentIntent.status === "succeeded") {
        router.replace(`/checkout/success?orderId=${orderId}`);
        return;
      }

      setError("Paiement en cours de finalisation. Si la page ne se met pas à jour, vérifiez votre relevé.");
    } catch (err: any) {
      setError(err?.message || "Erreur pendant la confirmation du paiement.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className={`inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition
          ${!stripe || !elements || submitting ? "bg-white/60 text-black/70 cursor-not-allowed" : "bg-white text-black hover:opacity-90"}
        `}
      >
        {submitting ? "Traitement…" : "Procéder au paiement"}
      </button>
    </form>
  );
}