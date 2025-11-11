"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// Composant qui utilise useSearchParams
function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();

  const returnTo = searchParams.get("returnTo") || "/";
  const emailPrefill = searchParams.get("email") || "";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(emailPrefill);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  // if already logged in, no need to register
  useEffect(() => {
    if (token) router.replace(returnTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !email.trim() || !password) {
      setError("Merci de renseigner tous les champs.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setSubmitting(true);

      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({ fullName, email, password }),
      });

      // after successful registration, send to login (prefill email + preserve returnTo)
      router.replace(
        `/login?returnTo=${encodeURIComponent(returnTo)}&email=${encodeURIComponent(email)}`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-md"
    >
      <h1 className="text-center text-2xl font-semibold text-white">Créer un compte</h1>

      {error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <label className="text-sm text-neutral-300">Nom complet</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ex. Jean Dupont"
          autoComplete="name"
          className="w-full rounded-md border border-neutral-800 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-neutral-600"
        />
      </div>

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
        <div className="relative">
          <input
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            className="w-full rounded-md border border-neutral-800 bg-neutral-800 px-3 py-2 pr-10 text-white outline-none focus:border-neutral-600"
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute inset-y-0 right-2 my-auto rounded px-2 text-xs text-neutral-300 hover:text-white"
            aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPwd ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-neutral-300">Confirmer le mot de passe</label>
        <input
          type={showPwd ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
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
        {submitting ? "Création en cours…" : "Créer mon compte"}
      </button>

      <p className="text-center text-sm text-neutral-400">
        Déjà un compte ?{" "}
        <Link
          href={`/login?returnTo=${encodeURIComponent(returnTo)}${
            email ? `&email=${encodeURIComponent(email)}` : ""
          }`}
          className="underline underline-offset-4 hover:text-white"
        >
          Se connecter
        </Link>
      </p>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <Suspense fallback={
        <div className="w-full max-w-sm space-y-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-md">
          <div className="h-8 w-48 mx-auto skeleton rounded" />
          <div className="space-y-4">
            <div className="h-20 w-full skeleton rounded" />
            <div className="h-20 w-full skeleton rounded" />
            <div className="h-20 w-full skeleton rounded" />
            <div className="h-20 w-full skeleton rounded" />
            <div className="h-10 w-full skeleton rounded" />
          </div>
        </div>
      }>
        <RegisterForm />
      </Suspense>
    </main>
  );
}