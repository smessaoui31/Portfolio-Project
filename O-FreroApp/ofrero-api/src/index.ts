import app from "./app";

const PORT = Number(process.env.PORT ?? 5050);

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://localhost:${PORT}`);
});

server.on("error", (err) => {
  console.error("Server error:", err);
});