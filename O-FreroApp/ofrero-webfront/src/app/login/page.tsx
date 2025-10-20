"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@ofrero.fr");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErr(json?.error || "Identifiants invalides");
      } else {
        // backend renvoie { accessToken, role? }
        const token = json?.accessToken as string;
        if (!token) throw new Error("Token manquant");
        login(token);
        router.push("/");
      }
    } catch (e: any) {
      setErr(e?.message || "Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <h1 className="text-2xl font-semibold text-zinc-50 mb-6">Se connecter</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-neutral-900 p-5 rounded-xl border border-neutral-800">
        <div>
          <label className="block text-sm text-neutral-300 mb-1">Email</label>
          <input
            className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/20"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-300 mb-1">Mot de passe</label>
          <input
            className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/20"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {err && <p className="text-sm text-red-400">{err}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-white text-black py-2 font-medium hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </main>
  );
}