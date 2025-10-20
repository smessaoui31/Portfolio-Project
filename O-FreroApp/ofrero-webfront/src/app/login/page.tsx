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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5050"}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Login failed");
      // notre API peut renvoyer { accessToken, role? }
      login(data.accessToken, data.role ?? null);
      router.push("/");
    } catch (e: any) {
      setErr(e.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-900 text-neutral-100 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-neutral-800 p-6 rounded-2xl shadow-xl space-y-4">
        <h1 className="text-xl font-semibold">Connexion</h1>
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <div className="space-y-2">
          <label className="text-sm text-neutral-300">Email</label>
          <input
            className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 outline-none"
            value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-neutral-300">Mot de passe</label>
          <input
            className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 outline-none"
            value={password} onChange={(e)=>setPassword(e.target.value)} type="password" required
          />
        </div>
        <button
          disabled={loading}
          className="w-full rounded-lg bg-white text-black font-medium py-2 hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}