"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const { loginFromApi } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("http://127.0.0.1:5050/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de connexion");

      // Stockage du token et redirection
      loginFromApi(data);

      toast.success("Connexion réussie ✨", {
        description: `Bienvenue${
          data?.user?.fullName ? `, ${data.user.fullName}` : ""
        } !`,
      });

      const returnTo = searchParams.get("returnTo") || "/";
      router.push(returnTo);
    } catch (err: any) {
      const msg = err?.message || "Échec de connexion";
      setError(msg);
      toast.error("Échec de connexion", { description: msg });
    } finally {
      setSubmitting(false);
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
          disabled={submitting}
          className="w-full bg-white text-black font-medium py-2 rounded-md transition hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}