import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

/** Online payment needs both Stripe keys and the webhook secret (paid orders are confirmed by the webhook). */
export function isOnlinePaymentEnabled(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY && env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && env.STRIPE_WEBHOOK_SECRET);
}

/** Best effort: an intent that already succeeded or was cancelled cannot be cancelled again. */
export async function cancelPaymentIntent(intentId: string): Promise<void> {
  try {
    await getStripe().paymentIntents.cancel(intentId);
  } catch (error) {
    console.warn("[paiement] annulation impossible", intentId, error instanceof Error ? error.message : error);
  }
}

export async function retrievePaymentIntentStatus(intentId: string): Promise<string> {
  return (await getStripe().paymentIntents.retrieve(intentId)).status;
}

export async function createPaymentIntent(order: {
  id: string;
  number: number;
  totalCents: number;
  customerEmail: string;
}): Promise<{ intentId: string; clientSecret: string }> {
  const intent = await getStripe().paymentIntents.create({
    amount: order.totalCents,
    currency: "eur",
    automatic_payment_methods: { enabled: true },
    metadata: { orderId: order.id, number: String(order.number) },
    receipt_email: order.customerEmail,
    description: `O'Frero commande n°${String(order.number).padStart(4, "0")}`,
  });
  if (!intent.client_secret) throw new Error("PaymentIntent sans client_secret");
  return { intentId: intent.id, clientSecret: intent.client_secret };
}
