import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY in .env");
}

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2026-08-26.dahlia" // version d'API épinglée par le SDK stripe v22
});