"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:5050/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de connexion");

      login(data.accessToken, data.user.role, data.user.email);
      window.location.href = "/"; // redirection vers l’accueil
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950">
      <form
        onSubmit={handleSubmit}
        className="bg-neutral-900 p-8 rounded-2xl shadow-md w-full max-w-sm space-y-5 border border-neutral-800"
      >
        <h1 className="text-2xl font-semibold text-white text-center">Connexion</h1>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md px-3 py-2 bg-neutral-800 text-white focus:outline-none"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md px-3 py-2 bg-neutral-800 text-white focus:outline-none"
        />
        <button
          type="submit"
          className="w-full bg-white text-black font-medium py-2 rounded-md hover:opacity-90 transition"
        >
          Se connecter
        </button>
      </form>
    </main>
  );
}