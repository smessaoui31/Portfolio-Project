import express from "express";
const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

// Logger : on voit chaque requête dans le terminal
app.use((req, _res, next) => {
  console.log(`>> ${req.method} ${req.url}`);
  next();
});

app.use(express.json());

// Page d'accueil simple (GET /)
app.get("/", (_req, res) => {
  res.type("html").send(`
    <h1>O'Frero API</h1>
    <p>Server is running ✅</p>
    <p>Health check: <a href="/health">/health</a></p>
  `);
});

// Healthcheck (GET /health)
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "ofrero-api" });
});

// 404 lisible
app.use((_req, res) => {
  res.status(404).type("text").send("Not Found");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://localhost:${PORT}`);
});