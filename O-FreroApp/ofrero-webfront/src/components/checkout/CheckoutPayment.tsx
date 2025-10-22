"use client";

import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";

export default function CheckoutPayment({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!stripe || !elements) return;

    setLoading(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // URL de redirection finale (succès/échec)
        return_url: `${window.location.origin}/checkout/success?orderId=${orderId}`,
      },
      redirect: "if_required",
    });

    if (error) {
      setErr(error.message || "Le paiement a échoué.");
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      router.push(`/checkout/success?orderId=${orderId}`);
    } else {
      // pending / requires_action → Stripe gère la redirection si nécessaire
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      {err && <p className="text-sm text-red-400">{err}</p>}
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || !elements || loading}
        className={`mt-2 inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-black transition ${
          loading ? "opacity-70 cursor-wait" : "hover:-translate-y-0.5"
        }`}
      >
        {loading ? "Paiement en cours…" : "Payer maintenant"}
      </button>
    </form>
  );
}