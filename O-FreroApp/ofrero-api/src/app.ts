import "dotenv/config";
import express from "express";
import swaggerUi from "swagger-ui-express";
import openapi from "../openapi/openapi.json";


import { authRouter } from "./routes/auth.routes";
import { meRouter } from "./routes/me.routes";
import { adminRouter } from "./routes/admin.routes";

const app = express();

// middlewares globaux
app.use((req, _res, next) => { console.log(`>> ${req.method} ${req.url}`); next(); });
app.use(express.json());

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

// 404
app.use((_req, res) => res.status(404).send("Not Found"));

export default app;