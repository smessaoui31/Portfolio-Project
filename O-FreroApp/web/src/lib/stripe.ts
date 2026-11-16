import Stripe from "stripe";
import { env } from "@/lib/env";

let client: Stripe | undefined;

export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY manquante : le paiement en ligne est désactivé.");
  client ??= new Stripe(env.STRIPE_SECRET_KEY);
  return client;
}
