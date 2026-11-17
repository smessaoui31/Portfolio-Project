"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatEuros } from "@/lib/money";

let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = (key: string) => (stripePromise ??= loadStripe(key));

export function StripePayment({
  publishableKey,
  clientSecret,
  trackingToken,
  totalCents,
}: {
  publishableKey: string;
  clientSecret: string;
  trackingToken: string;
  totalCents: number;
}) {
  const options = useMemo(
    () => ({
      clientSecret,
      locale: "fr" as const,
      appearance: {
        theme: "night" as const,
        variables: {
          colorPrimary: "#ff5a1f",
          colorBackground: "#1a1410",
          colorText: "#f3e9d8",
          colorDanger: "#ff8a7a",
          borderRadius: "12px",
          fontFamily: "Inter, system-ui, sans-serif",
        },
      },
    }),
    [clientSecret],
  );
  return (
    <Elements stripe={getStripe(publishableKey)} options={options}>
      <PaymentForm trackingToken={trackingToken} totalCents={totalCents} />
    </Elements>
  );
}

function PaymentForm({ trackingToken, totalCents }: { trackingToken: string; totalCents: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  async function pay() {
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/suivi/${trackingToken}?paye=1` },
    });
    // Only reached when the payment could not be confirmed (success redirects).
    setError(stripeError.message ?? "Le paiement n'a pas abouti. Réessaie ou change de moyen de paiement.");
    setPaying(false);
  }

  return (
    <div className="space-y-6">
      <PaymentElement />
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <Button size="lg" className="w-full justify-between" onClick={pay} disabled={!stripe || paying}>
        <span>{paying ? "Paiement…" : "Payer"}</span>
        <span className="tabular-nums">{formatEuros(totalCents)}</span>
      </Button>
    </div>
  );
}
