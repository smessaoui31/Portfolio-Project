import Stripe from "stripe";
import { env } from "@/lib/env";
import { handleStripeEvent } from "@/server/lifecycle";

export async function POST(request: Request): Promise<Response> {
  const secret = env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook non configuré", { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Signature manquante", { status: 400 });

  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return new Response("Signature invalide", { status: 400 });
  }

  await handleStripeEvent(event);
  return Response.json({ received: true });
}
