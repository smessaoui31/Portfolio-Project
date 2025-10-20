import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import cors from "cors";

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

// Charge le YAML de façon robuste (OK en dev et après build)
const openapiDocument = YAML.load(path.resolve(process.cwd(), "openapi/openapi.yaml"));

const app = express();

/** Logger minimal */
app.use((req, _res, next) => {
  console.log(`>> ${req.method} ${req.url}`);
  next();
});

/**
 * Stripe webhook : RAW body UNIQUEMENT et AVANT express.json()
 * (Pas besoin de CORS pour ce endpoint côté navigateur)
 */
app.post("/checkout/webhook", bodyParser.raw({ type: "application/json" }), checkoutWebhookHandler);

/** CORS — doit arriver AVANT les routes JSON */
const ALLOWED_ORIGINS = [
  process.env.FRONT_URL || "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3002",
  "http://localhost:3002",
];

const corsOptions: cors.CorsOptions = {
  origin(origin, cb) {
    // Autorise Postman/curl (pas d'Origin) et les origines whitelistees
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
// (optionnel) répondre explicitement aux preflight

/** Parsers standards pour le reste des routes */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/** Seed admin au boot (in-memory pour dev) */
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

/** Docs (Swagger UI) */
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

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