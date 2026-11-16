"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { placeOrderAction, type DeliveryQuoteResult } from "@/app/actions/order";
import { cartCount, useCart, useCartReady } from "@/components/cart/cart-store";
import { buttonClasses } from "@/components/ui/Button";
import type { FulfillmentMode, PaymentMethod } from "@/domain/types";
import { formatParisTime } from "@/lib/time";
import { DetailsStep } from "./DetailsStep";
import { ModeStep } from "./ModeStep";
import { StripePayment } from "./StripePayment";
import { LAST_EMAIL_KEY, type AddressDraft, type CheckoutAccount, type CustomerDraft } from "./types";

type Step = "mode" | "details" | "payment";

export function Checkout({
  account,
  onlinePayment,
  publishableKey,
}: {
  account: CheckoutAccount | null;
  onlinePayment: boolean;
  publishableKey: string | null;
}) {
  const router = useRouter();
  const ready = useCartReady();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);

  const defaultAddress = account?.addresses.find((a) => a.isDefault) ?? account?.addresses[0];
  const [step, setStep] = useState<Step>("mode");
  const [mode, setMode] = useState<FulfillmentMode>("PICKUP");
  const [slot, setSlot] = useState<string | null>(null);
  const [address, setAddress] = useState<AddressDraft>({
    line1: defaultAddress?.line1 ?? "",
    line2: defaultAddress?.line2 ?? "",
    postalCode: defaultAddress?.postalCode ?? "",
    city: defaultAddress?.city ?? "Toulouse",
  });
  const [delivery, setDelivery] = useState<DeliveryQuoteResult | null>(null);
  const [customer, setCustomer] = useState<CustomerDraft>({ firstName: account?.name ?? "", phone: "", email: account?.email ?? "" });
  const [payment, setPayment] = useState<PaymentMethod>(onlinePayment ? "ONLINE" : "AT_PICKUP");
  const [rewardLineIndex, setRewardLineIndex] = useState<number | undefined>(undefined);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ clientSecret: string; token: string; totalCents: number } | null>(null);

  if (!ready) return <p className="text-muted">Chargement…</p>;

  if (cartCount(lines) === 0 && !pending) {
    return (
      <div className="rounded-3xl border border-line-2 p-8 text-center">
        <p className="text-muted-2">Ton panier est vide.</p>
        <Link href="/carte" className={buttonClasses("primary", "lg", "mt-6")}>
          Voir la carte
        </Link>
      </div>
    );
  }

  function changeMode(next: FulfillmentMode) {
    setMode(next);
    if (next === "DELIVERY") setPayment("ONLINE");
    else if (!onlinePayment) setPayment("AT_PICKUP");
  }

  async function submit() {
    if (!slot) return;
    setPlacing(true);
    setError(null);
    const result = await placeOrderAction({
      mode,
      slotAt: slot,
      paymentMethod: payment,
      customer,
      address: mode === "DELIVERY" ? { ...address, line2: address.line2 || undefined } : undefined,
      lines: lines.map(({ productId, quantity, cooking, supplementIds }) => ({ productId, quantity, cooking, supplementIds })),
      rewardLineIndex,
    });
    setPlacing(false);
    if (!result.ok) {
      setError(result.message);
      if (result.error === "INVALID_SLOT") {
        setSlot(null);
        setStep("mode");
      }
      return;
    }
    try {
      sessionStorage.setItem(LAST_EMAIL_KEY, customer.email.trim().toLowerCase());
    } catch {
      // Private browsing: the sign-up link simply won't be prefilled.
    }
    if (result.clientSecret) {
      setPending({ clientSecret: result.clientSecret, token: result.trackingToken, totalCents: result.totalCents });
      setStep("payment");
      return;
    }
    clear();
    router.push(`/suivi/${result.trackingToken}?nouvelle=1`);
  }

  const summary = slot
    ? `${mode === "PICKUP" ? "À emporter" : "Livraison"} · ${mode === "DELIVERY" ? "vers " : ""}${formatParisTime(new Date(slot))}`
    : "";

  return (
    <div>
      <ol className="mb-8 flex gap-2" aria-label="Étapes">
        {(["mode", "details", "payment"] as const).map((s, i) => (
          <li
            key={s}
            aria-current={step === s ? "step" : undefined}
            className={`h-1 flex-1 rounded-full ${["mode", "details", "payment"].indexOf(step) >= i ? "bg-ember" : "bg-surface-2"}`}
          >
            <span className="sr-only">{["Mode et créneau", "Coordonnées", "Paiement"][i]}</span>
          </li>
        ))}
      </ol>

      {step === "mode" ? (
        <>
          <h1 className="font-display mb-8 text-5xl md:text-6xl">Comment tu la veux ?</h1>
          {error ? (
            <p role="alert" className="mb-6 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              {error}
            </p>
          ) : null}
          <ModeStep
            mode={mode}
            onModeChange={changeMode}
            slot={slot}
            onSlotChange={setSlot}
            address={address}
            onAddressChange={setAddress}
            delivery={delivery}
            onDeliveryChange={setDelivery}
            account={account}
            onlinePayment={onlinePayment}
            onContinue={() => {
              setError(null);
              setStep("details");
            }}
          />
        </>
      ) : null}

      {step === "details" ? (
        <>
          <h1 className="font-display mb-6 text-5xl md:text-6xl">Ta commande</h1>
          <DetailsStep
            mode={mode}
            summary={summary}
            customer={customer}
            onCustomerChange={setCustomer}
            payment={payment}
            onPaymentChange={setPayment}
            rewardLineIndex={rewardLineIndex}
            onRewardChange={setRewardLineIndex}
            deliveryFeeCents={mode === "DELIVERY" && delivery?.ok ? delivery.feeCents : 0}
            account={account}
            onlinePayment={onlinePayment}
            placing={placing}
            error={error}
            onBack={() => setStep("mode")}
            onSubmit={submit}
          />
        </>
      ) : null}

      {step === "payment" && pending && publishableKey ? (
        <>
          <h1 className="font-display mb-2 text-5xl md:text-6xl">Paiement</h1>
          <p className="mb-8 text-sm text-muted-2">{summary}</p>
          <StripePayment publishableKey={publishableKey} clientSecret={pending.clientSecret} trackingToken={pending.token} totalCents={pending.totalCents} />
        </>
      ) : null}
    </div>
  );
}
