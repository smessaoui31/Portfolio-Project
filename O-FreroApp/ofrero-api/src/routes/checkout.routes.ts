import { Router } from "express";
import Stripe from "stripe";
import { z } from "zod";
import { requireAuth, AuthRequest } from "../middleware/auth";
import {
  getOrCreateCart,
  cartTotalCents,
  ORDERS,
  createOrderFromCart,
  findOrderByPaymentIntent,
  setOrderStatus
} from "../data/store";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2024-06-20" });
export const checkoutRouter = Router();

// -------------- 1) Start checkout: create Order + PaymentIntent --------------
const CheckoutSchema = z.object({
  addressLine: z.string().min(3),
  city: z.string().min(2),
  postalCode: z.string().min(3),
  phone: z.string().min(6)
});

checkoutRouter.post("/start", requireAuth, async (req: AuthRequest, res) => {
  const parsed = CheckoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });

  // 1) Récupérer le cart de l'utilisateur
  const cart = getOrCreateCart(req.user!.id);
  if (cart.items.length === 0) return res.status(400).json({ error: "Cart is empty" });

  // 2) Calculer le total côté serveur
  const totalCents = cartTotalCents(cart);

  // 3) Créer une Order 'pending' à partir du cart
  const order = createOrderFromCart(req.user!.id, cart.items, totalCents);

  // 4) Créer un PaymentIntent Stripe (montant en centimes) et bien lier l'intent au panier pas à l'user
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: "eur",
    metadata: {
      order_id: order.id,
      user_id: req.user!.id
    },
    // pour les cartes de test, on autorise la confirmation côté client
    automatic_payment_methods: { enabled: true }
  });

  // 5) Lier la PI à la commande
  order.stripePaymentIntentId = paymentIntent.id;

  // 6) Retourner clientSecret au frontend (ou Postman)
  res.status(200).json({
    orderId: order.id,
    clientSecret: paymentIntent.client_secret
  });
});

// -------------- 2) Webhook: Stripe -> update order status --------------
// ATTENTION : pour Stripe, il faut le body brut (raw). On le gère dans app.ts 
checkoutRouter.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"] as string | undefined;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn("No STRIPE_WEBHOOK_SECRET set; ignoring signature verification (dev only).");
  }

  let event: Stripe.Event;

  try {
    if (sig && webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // si pas de signature/secret, on parse JSON direct
      event = req.body as Stripe.Event;
    }
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const order = findOrderByPaymentIntent(pi.id);
      if (order) setOrderStatus(order.id, "paid");
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const order = findOrderByPaymentIntent(pi.id);
      if (order) setOrderStatus(order.id, "failed");
      break;
    }
    default:
      // d'autres events possibles mais a voir apres le MVP
      break;
  }

  res.json({ received: true });
});

// -------------- 3) Consulter une commande --------------
checkoutRouter.get("/orders/:id", requireAuth, (req: AuthRequest, res) => {
  const order = ORDERS.find(o => o.id === req.params.id && o.userId === req.user!.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});