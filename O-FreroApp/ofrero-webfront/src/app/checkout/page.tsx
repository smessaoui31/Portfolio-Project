"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";
import { apiAuthed } from "@/lib/api";
import CheckoutPayment from "@/components/checkout/CheckoutPayment";

type StartResponse = {
  orderId: string;
  clientSecret: string;
  paymentIntentId: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleStart(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      addressLine: String(fd.get("addressLine") || ""),
      city: String(fd.get("city") || ""),
      postalCode: String(fd.get("postalCode") || ""),
      phone: String(fd.get("phone") || ""),
    };

    try {
      const res = await apiAuthed<StartResponse>("/checkout/start", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setClientSecret(res.clientSecret);
      setOrderId(res.orderId);
      setStep(2);
    } catch (e: any) {
      setErr(e?.message || "Erreur lors du démarrage du paiement");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="mb-2 text-2xl font-semibold text-white">Paiement</h1>
      <p className="mb-6 text-sm text-neutral-400">
        Renseignez votre adresse puis réglez en toute sécurité avec Stripe.
      </p>

      {step === 1 && (
        <form
          onSubmit={handleStart}
          className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6"
        >
          {err && <p className="text-sm text-red-400">{err}</p>}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm text-neutral-300">Adresse</span>
              <input
                name="addressLine"
                required
                className="w-full rounded-md bg-neutral-800 px-3 py-2 text-white outline-none"
                placeholder="12 rue de la République"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-neutral-300">Ville</span>
              <input
                name="city"
                required
                className="w-full rounded-md bg-neutral-800 px-3 py-2 text-white outline-none"
                placeholder="Paris"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-neutral-300">Code postal</span>
              <input
                name="postalCode"
                required
                className="w-full rounded-md bg-neutral-800 px-3 py-2 text-white outline-none"
                placeholder="75001"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-neutral-300">Téléphone</span>
              <input
                name="phone"
                type="tel"
                required
                className="w-full rounded-md bg-neutral-800 px-3 py-2 text-white outline-none"
                placeholder="+33601020304"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`mt-2 inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-black transition ${
              loading ? "opacity-70 cursor-wait" : "hover:-translate-y-0.5"
            }`}
          >
            {loading ? "Création du paiement…" : "Continuer vers le paiement"}
          </button>
        </form>
      )}

      {step === 2 && clientSecret && (
        <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "night",
                variables: {
                  colorPrimary: "#ffffff",
                },
              },
            }}
          >
            <CheckoutPayment orderId={orderId!} />
          </Elements>
        </div>
      )}
    </div>
  );
}