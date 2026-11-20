"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/redirect";
import { useCart } from "@/components/cart/cart-store";
import { CART_OWNER_KEY } from "@/components/cart/CartSync";
import { authErrorMessage } from "./auth-errors";
import { readReferralCode } from "@/lib/device-storage";

function FormShell({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-12 md:py-16">
      <h1 className="font-display text-5xl md:text-6xl">{title}</h1>
      {intro ? <div className="mt-3 text-muted-2">{intro}</div> : null}
      <div className="mt-8">{children}</div>
    </div>
  );
}

function ErrorText({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
      {message}
    </p>
  ) : null;
}

export function SignInForm({ next }: { next: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: authError } = await authClient.signIn.email({ email, password });
    setBusy(false);
    if (authError) return setError(authErrorMessage(authError));
    router.push(safeNext(next));
    router.refresh();
  }

  return (
    <FormShell title="Connexion" intro="Retrouve ta carte de fidélité et tes commandes.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="E-mail">{(p) => <Input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />}</Field>
        <Field label="Mot de passe">
          {(p) => <Input {...p} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />}
        </Field>
        <ErrorText message={error} />
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Connexion…" : "Se connecter"}
        </Button>
      </form>
      <div className="mt-6 flex flex-wrap justify-between gap-3 text-sm text-muted-2">
        <Link href="/compte/mot-de-passe" className="underline-offset-4 hover:text-fg hover:underline">
          Mot de passe oublié
        </Link>
        <Link href="/compte/inscription" className="font-semibold text-fg underline-offset-4 hover:underline">
          Créer un compte
        </Link>
      </div>
    </FormShell>
  );
}

export function SignUpForm({ defaultEmail }: { defaultEmail: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [referral, setReferral] = useState(() => (typeof window === "undefined" ? "" : (readReferralCode() ?? "")));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: authError } = await authClient.signUp.email({
      name,
      email,
      password,
      referralCodeUsed: referral.trim() || undefined,
      callbackURL: "/compte?verifie=1",
    });
    setBusy(false);
    if (authError) return setError(authErrorMessage(authError));
    router.push(`/compte/verification?email=${encodeURIComponent(email)}`);
    router.refresh();
  }

  return (
    <FormShell
      title="Créer un compte"
      intro="Facultatif, mais utile : tes tampons de fidélité, ta collection d'éditions et tes commandes en un geste."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Prénom">{(p) => <Input {...p} autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} required />}</Field>
        <Field label="E-mail" hint="Utilise celle de tes commandes : elles seront rattachées à ton compte.">
          {(p) => <Input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />}
        </Field>
        <Field label="Mot de passe" hint="8 caractères minimum.">
          {(p) => (
            <Input {...p} type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
          )}
        </Field>
        <Field label="Code de parrainage" hint="Facultatif : le code d'un ami qui t'a invité.">
          {(p) => <Input {...p} autoComplete="off" value={referral} onChange={(e) => setReferral(e.target.value.toUpperCase())} maxLength={12} />}
        </Field>
        <ErrorText message={error} />
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Création…" : "Créer mon compte"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted-2">
        Déjà un compte ?{" "}
        <Link href="/compte/connexion" className="font-semibold text-fg underline-offset-4 hover:underline">
          Se connecter
        </Link>
      </p>
    </FormShell>
  );
}

export function ResendVerification({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sent" | "error">("idle");
  return (
    <div className="space-y-3">
      <Button
        variant="secondary"
        size="lg"
        disabled={!email || state === "sent"}
        onClick={async () => {
          const { error } = await authClient.sendVerificationEmail({ email, callbackURL: "/compte?verifie=1" });
          setState(error ? "error" : "sent");
        }}
      >
        {state === "sent" ? "E-mail renvoyé" : "Renvoyer l'e-mail"}
      </Button>
      {state === "error" ? <p className="text-sm text-danger">L&apos;envoi a échoué. Réessaie dans un instant.</p> : null}
    </div>
  );
}

export function PasswordReset({ token }: { token: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  if (token) {
    return (
      <FormShell title="Nouveau mot de passe">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setState("busy");
            const { error: authError } = await authClient.resetPassword({ newPassword: password, token });
            setState("idle");
            if (authError) return setError(authErrorMessage(authError));
            router.push("/compte/connexion");
          }}
        >
          <Field label="Nouveau mot de passe" hint="8 caractères minimum.">
            {(p) => <Input {...p} type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />}
          </Field>
          <ErrorText message={error} />
          <Button type="submit" size="lg" className="w-full" disabled={state === "busy"}>
            Enregistrer
          </Button>
        </form>
      </FormShell>
    );
  }

  return (
    <FormShell title="Mot de passe oublié" intro="Indique ton e-mail : tu recevras un lien pour en choisir un nouveau.">
      {state === "sent" ? (
        <p className="text-muted-2">Si un compte existe avec cette adresse, le lien vient de partir. Pense à regarder tes indésirables.</p>
      ) : (
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setState("busy");
            await authClient.requestPasswordReset({ email, redirectTo: "/compte/mot-de-passe" });
            setState("sent");
          }}
        >
          <Field label="E-mail">{(p) => <Input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />}</Field>
          <Button type="submit" size="lg" className="w-full" disabled={state === "busy"}>
            Envoyer le lien
          </Button>
        </form>
      )}
    </FormShell>
  );
}

export function SignOutButton() {
  const router = useRouter();
  const clear = useCart((s) => s.clear);
  return (
    <Button
      variant="ghost"
      onClick={async () => {
        await authClient.signOut();
        clear();
        try {
          localStorage.removeItem(CART_OWNER_KEY);
        } catch {
          // Nothing to forget.
        }
        router.push("/");
        router.refresh();
      }}
    >
      Se déconnecter
    </Button>
  );
}
