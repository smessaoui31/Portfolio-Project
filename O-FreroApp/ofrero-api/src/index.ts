import express from "express";
import swaggerUi from "swagger-ui-express";
import openapi from "../openapi/openapi.json";
import "dotenv/config";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { secureHeapUsed } from "crypto";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5050;
type User = { id: string; email: string; passwordHash: string; fullName: string };
const USERS: User[] = [];
const newId = () => "u_" + Math.random().toString(36).slice(2, 10);

// Logger
app.use((req, _res, next) => {
  console.log(`>> ${req.method} ${req.url}`);
  next();
});

app.use(express.json());

// POST /auth/register
app.post("/auth/register", async (req, res) => {
  // 1) Valider le corps de requête
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(2),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
  }
  const { email, password, fullName } = parsed.data;

  // 2) Check si l'email a deja été used
  const exists = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) return res.status(409).json({ error: "Email already in use" });

  // 3) Hache le mdp et crée l'user
  const passwordHash = await bcrypt.hash(password, 10);
  const user: User = { id: newId(), email, fullName, passwordHash };
  USERS.push(user);

  // 4) Répondre sans envoyer le mdp haché
  return res.status(201).json({ id: user.id, email: user.email, fullName: user.fullName });
});

// Page d'accueil simple (GET /)
app.get("/", (_req, res) => {
  res.type("html").send(`
    <h1>O'Frero API</h1>
    <p>Server is running ✅</p>
    <p>Health check: <a href="/health">/health</a></p>
    <p>API Docs: <a href="/docs">/docs</a></p>
  `);
});

// Healthcheck
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "ofrero-api" });
});

// 👉 Swagger docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));

// 404 handler
app.use((_req, res) => {
  res.status(404).type("text").send("Not Found");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://localhost:${PORT}`);
});