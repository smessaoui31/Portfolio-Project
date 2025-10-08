import "dotenv/config";
import express, { application } from "express";
import swaggerUi from "swagger-ui-express";
import openapi from "../openapi/openapi.json";


import { authRouter } from "./routes/auth.routes";
import { meRouter } from "./routes/me.routes";
import { adminRouter } from "./routes/admin.routes";
import { cartRouter } from "./routes/cart.routes";
import bcrypt from "bcryptjs";
import { USERS, newId } from "./data/store";
import { checkoutRouter } from "./routes/checkout.routes";

import bodyParser from "body-parser"; // géré par express mais on importe quand meme
import { check } from "zod";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASS  = process.env.ADMIN_PASS;
const ADMIN_NAME  = process.env.ADMIN_NAME ?? "Site Admin";

// Seed admin (dev)
(async () => {
  if (ADMIN_EMAIL && ADMIN_PASS) {
    const exists = USERS.find(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (!exists) {
      const hash = await bcrypt.hash(ADMIN_PASS, 10);
      USERS.push({ id: newId(), email: ADMIN_EMAIL, fullName: ADMIN_NAME, passwordHash: hash, role: "admin" });
      console.log(`> Seeded admin: ${ADMIN_EMAIL}`);
    }
  }
})();

const app = express();

// middlewares globaux
app.use((req, _res, next) => { console.log(`>> ${req.method} ${req.url}`); next(); });

// Raw pour le webhook Stripe , toujours AVANT express.json
app.post("/checkout/webhook", bodyParser.raw({ type: "application/json" }), checkoutRouter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// pages simples
app.get("/", (_req, res) => {
  res.type("html").send(`<h1>O'Frero API</h1><p>OK ✅</p><p><a href="/health">/health</a> | <a href="/docs">/docs</a></p>`);
});
app.get("/health", (_req, res) => res.json({ ok: true, service: "ofrero-api" }));

// docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));

// routes API
app.use("/auth", authRouter);
app.use("/me", meRouter);
app.use("/admin", adminRouter);
app.use("/cart", cartRouter);
app.use("/checkout", checkoutRouter);

// 404
app.use((_req, res) => res.status(404).send("Not Found"));

export default app;