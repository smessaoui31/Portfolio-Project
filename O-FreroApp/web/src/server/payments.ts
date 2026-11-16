import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

export function isOnlinePaymentEnabled(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY && env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
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
