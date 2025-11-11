"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// Composant qui utilise useSearchParams
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginFromApi, token } = useAuth();

  const returnTo = searchParams.get("returnTo") || "/";
  const emailFromRegister = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromRegister);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // if already logged in, bounce to returnTo
  useEffect(() => {
    if (token) router.replace(returnTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      setSubmitting(true);
      const res = await fetch("http://127.0.0.1:5050/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Login failed");

      // use the flexible helper you added earlier
      loginFromApi(data);

      // go back where the user came from
      router.replace(returnTo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-md"
    >
      <h1 className="text-center text-2xl font-semibold text-white">Se connecter</h1>

      {error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <label className="text-sm text-neutral-300">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.fr"
          autoComplete="email"
          className="w-full rounded-md border border-neutral-800 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-neutral-600"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-neutral-300">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          className="w-full rounded-md border border-neutral-800 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-neutral-600"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className={`w-full rounded-md px-4 py-2 text-sm font-medium transition ${
          submitting
            ? "cursor-not-allowed bg-white/60 text-black/70"
            : "bg-white text-black hover:opacity-90"
        }`}
      >
        {submitting ? "Connexion…" : "Se connecter"}
      </button>

      <p className="text-center text-sm text-neutral-400">
        Pas de compte ?{" "}
        <Link
          href={`/register?returnTo=${encodeURIComponent(returnTo)}${
            email ? `&email=${encodeURIComponent(email)}` : ""
          }`}
          className="underline underline-offset-4 hover:text-white"
        >
          Créer un compte
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <Suspense fallback={
        <div className="w-full max-w-sm space-y-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-md">
          <div className="h-8 w-48 mx-auto skeleton rounded" />
          <div className="space-y-4">
            <div className="h-20 w-full skeleton rounded" />
            <div className="h-20 w-full skeleton rounded" />
            <div className="h-10 w-full skeleton rounded" />
          </div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </main>
  );
}