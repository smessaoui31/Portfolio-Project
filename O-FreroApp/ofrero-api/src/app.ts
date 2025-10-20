import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import swaggerUi from "swagger-ui-express";
import openapi from "../openapi/openapi.json";

import { authRouter } from "./routes/auth.routes";
import { meRouter } from "./routes/me.routes";
import { adminRouter } from "./routes/admin.routes";
import { cartRouter } from "./routes/cart.routes";
import { checkoutRouter, checkoutWebhookHandler } from "./routes/checkout.routes";
import { productsRouter } from "./routes/products.routes";
import { ordersRouter } from "./routes/orders.routes";
import { addressRouter } from "./routes/address.routes";
import { categoriesRouter } from "./routes/categories.routes";

import bcrypt from "bcryptjs";
import { USERS, newId } from "./data/store";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_FULLNAME = process.env.ADMIN_FULLNAME ?? "Site Admin";

const app = express();

/** Logger minimal */
app.use((req, _res, next) => {
  console.log(`>> ${req.method} ${req.url}`);
  next();
});

/**
 *  Stripe webhook : RAW body UNIQUEMENT 
 */
app.post("/checkout/webhook", bodyParser.raw({ type: "application/json" }), checkoutWebhookHandler);

/** Parsers standards pour le reste des routes */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/** Seed admin au boot */
(async () => {
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const exists = USERS.find(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (!exists) {
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      USERS.push({
        id: newId(),
        email: ADMIN_EMAIL,
        fullName: ADMIN_FULLNAME,
        passwordHash: hash,
        role: "admin",
      });
      console.log(`> Seeded admin: ${ADMIN_EMAIL}`);
    } else {
      console.log(`> Admin already exists: ${ADMIN_EMAIL}`);
    }
  } else {
    console.log("> Seed admin skipped (ADMIN_EMAIL/ADMIN_PASSWORD not set)");
  }
})();

/** Pages simples */
app.get("/", (_req, res) => {
  res
    .type("html")
    .send(`<h1>O'Frero API</h1><p>OK ✅</p><p><a href="/health">/health</a> | <a href="/docs">/docs</a></p>`);
});
app.get("/health", (_req, res) => res.json({ ok: true, service: "ofrero-api" }));

/** Docs */
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));

/** Routes API */
app.use("/auth", authRouter);
app.use("/me", meRouter);
app.use("/admin", adminRouter);
app.use("/cart", cartRouter);
app.use("/orders", ordersRouter);
app.use("/addresses", addressRouter);
app.use("/products", productsRouter);
app.use("/checkout", checkoutRouter);
app.use("/categories", categoriesRouter);

/** 404 */
app.use((_req, res) => res.status(404).send("Not Found"));

export default app;