import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY in .env");
}

// laisser stripe choisir sa version par défaut pour meilleure opti
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2025-09-30.clover" // A adapter si besoin en cas de pépin
});