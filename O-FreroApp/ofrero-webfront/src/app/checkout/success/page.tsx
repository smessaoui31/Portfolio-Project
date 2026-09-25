// src/app/checkout/success/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, apiAuthed } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import ConfettiEffect from "@/components/theme/ui/ConfettiEffect";

type OrderItem = {
  id: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
};

type OrderPayment = {
  provider: string;
  status: string;
  intentId?: string;
  cardLast4?: string | null;
  method?: string | null;
};

type OrderDetail = {
  id: string;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | string;
  totalCents: number;
  createdAt: string;
  items: OrderItem[];
  shippingLine1: string;
  shippingLine2?: string | null;
  shippingCity: string;
  shippingPostalCode: string;
  shippingPhone: string;
  payment?: OrderPayment | null;
  user?: { id: string; email?: string; fullName?: string } | null;
};

// Composant qui utilise useSearchParams
function SuccessContent() {
  const search = useSearchParams();
  const orderId = search.get("orderId") || "";
  const { token } = useAuth();
  const { isGuest, clear: clearCart } = useCart();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // animation gates
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // déverrouille les animations après le 1er render
    const t = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Confetti déclenché depuis le médaillon, une fois le paiement confirmé
  const medallionRef = useRef<HTMLDivElement>(null);
  const [confettiPos, setConfettiPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!(order?.status === "PAID" && ready) || !medallionRef.current) return;
    const rect = medallionRef.current.getBoundingClientRect();
    setConfettiPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  }, [order?.status, ready]);

  useEffect(() => {
    if (!orderId) {
      setErr("Identifiant de commande manquant.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        // Utiliser apiAuthed si connecté, sinon api (pour les invités)
        const data = token
          ? await apiAuthed<OrderDetail>(`/checkout/orders/${orderId}`)
          : await api<OrderDetail>(`/checkout/orders/${orderId}`);
        setOrder(data);

        // La commande a bien été créée : on vide le panier invité (le panier
        // authentifié, lui, est déjà vidé côté serveur dès /checkout/start).
        if (isGuest) {
          clearCart().catch(() => {});
        }
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Impossible de charger la commande.");
      } finally {
        setLoading(false);
      }
    })();
    // ne doit se relancer que si la commande ou la session change, pas à chaque re-render du panier
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, token]);

  const isPaid = order?.status === "PAID";
  const itemsCount = useMemo(
    () => (order?.items || []).reduce((n, it) => n + it.quantity, 0),
    [order]
  );

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-border bg-card/50 p-8">
          <div className="h-6 w-40 skeleton mb-4 rounded" />
          <div className="h-4 w-64 skeleton mb-2 rounded" />
          <div className="h-4 w-56 skeleton mb-6 rounded" />
          <div className="h-24 w-full skeleton rounded" />
        </div>
      </main>
    );
  }

  if (err || !order) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8">
          <h1 className="text-foreground text-xl font-semibold">Une erreur est survenue</h1>
          <p className="mt-2 text-sm text-red-300">{err || "Commande introuvable."}</p>
          <div className="mt-6">
            <Link
              href="/menu"
              className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90"
            >
              Retourner au menu
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const formattedTotal = ((order.totalCents ?? 0) / 100).toFixed(2);
  const shortId = order.id.slice(0, 8);

  const paymentMethodLabel = (() => {
    const p = order.payment;
    if (!p) return "—";
    if (p.method === "card" || p.provider === "stripe") {
      const last4 = p.cardLast4 ?? null;
      return `Carte • ${last4 ? last4 : "••••"}`;
    }
    return p.provider ?? "—";
  })();

  return (
    <main className="mx-auto max-w-4xl px-4 py-14">
      {/* Carte principale + animation entrée */}
      <section
        className={`relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-neutral-900/60 to-neutral-950/30 p-6 transition-all duration-700 ${
          ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        {/* Confetti minimal (subtil) */}
        <ConfettiEffect position={confettiPos} count={12} onComplete={() => setConfettiPos(null)} />

        <div className="flex items-start gap-5">
          {/* Médaillon animé */}
          <div className="relative" ref={medallionRef}>
            <div
              className={`absolute inset-0 rounded-xl ${
                isPaid && ready ? "pulse-halo" : ""
              }`}
              aria-hidden
            />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <AnimatedCheck active={isPaid && ready} />
            </div>
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-foreground">
              {isPaid ? "Paiement confirmé" : "Commande reçue"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Merci pour votre commande — elle a bien été {isPaid ? "payée et validée" : "enregistrée"}.
            </p>
          </div>
        </div>

        {/* Carte de récapitulatif */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="col-span-2 rounded-lg border border-border bg-card/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Numéro de commande</div>
                <div className="mt-1 font-medium text-foreground">#{shortId}</div>
              </div>

              <div className="text-right">
                <div className="text-xs text-muted-foreground">Montant payé</div>
                <div className="mt-1 text-xl font-semibold text-foreground">{formattedTotal} €</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <div>{itemsCount} article{itemsCount > 1 ? "s" : ""}</div>
              <div>{new Date(order.createdAt).toLocaleString("fr-FR")}</div>
            </div>

            <div className="mt-3 flex items-center gap-3 text-sm">
              <div className="rounded-md bg-secondary/40 px-3 py-1 text-foreground">
                {paymentMethodLabel}
              </div>
              {order.payment?.intentId ? (
                <div className="text-xs text-muted-foreground">
                  Transaction : {truncate(order.payment.intentId)}
                </div>
              ) : null}
            </div>
          </div>

          {/* Livraison */}
          <div className="rounded-lg border border-border bg-card/40 p-4">
            <div className="text-xs text-muted-foreground">Livraison</div>
            <div className="mt-1 text-sm text-foreground">
              {order.shippingLine1}
              {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {order.shippingPostalCode} {order.shippingCity}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">Téléphone</div>
            <div className="mt-1 text-sm text-foreground">{order.shippingPhone}</div>
          </div>
        </div>
      </section>

      {/* Articles */}
      <section
        className={`mt-6 rounded-2xl border border-border bg-card/50 p-6 transition-all duration-700 delay-100 ${
          ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        <h2 className="text-foreground font-medium mb-4">Résumé de votre commande</h2>
        <ul className="divide-y divide-border">
          {order.items.map((it) => (
            <li key={it.id} className="py-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm text-foreground">{it.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(it.unitPriceCents / 100).toFixed(2)} € × {it.quantity}
                </div>
              </div>
              <div className="text-sm text-foreground font-medium">
                {((it.unitPriceCents * it.quantity) / 100).toFixed(2)} €
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-muted-foreground text-sm">Total</span>
          <span className="text-foreground font-semibold">{formattedTotal} €</span>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Un e-mail de confirmation a été envoyé à votre adresse.
          </div>
          <div className="flex gap-2">
            <Link
              href="/orders"
              className="rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-accent/60"
            >
              Mes commandes
            </Link>
            <Link
              href="/menu"
              className="rounded-md bg-white px-3 py-2 text-sm font-medium text-black hover:opacity-95"
            >
              Revenir au menu
            </Link>
          </div>
        </div>
      </section>

      {/* Styles anim (scopés) */}
      <style jsx>{`
        /* halo discret autour de l'icône validée */
        .pulse-halo {
          animation: halo 1600ms ease-out 200ms both;
        }
        @keyframes halo {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.25);
          }
          100% {
            box-shadow: 0 0 0 24px rgba(16, 185, 129, 0);
          }
        }
      `}</style>
    </main>
  );
}

// Page principale avec Suspense
export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-border bg-card/50 p-8">
          <div className="h-6 w-40 skeleton mb-4 rounded" />
          <div className="h-4 w-64 skeleton mb-2 rounded" />
          <div className="h-4 w-56 skeleton mb-6 rounded" />
          <div className="h-24 w-full skeleton rounded" />
        </div>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}

/* ---------- composants internes ---------- */

function AnimatedCheck({ active }: { active: boolean }) {
  // SVG check qui se "dessine" via stroke-dashoffset
  return (
    <>
      <svg
        className="h-7 w-7"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <path
          d="M20 6L9 17l-5-5"
          stroke="currentColor"
          className={`text-emerald-300 ${active ? "draw" : ""}`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <style jsx>{`
        .draw {
          stroke-dasharray: 28;
          stroke-dashoffset: 28;
          animation: draw-check 650ms ease forwards 120ms;
        }
        @keyframes draw-check {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </>
  );
}

/* ---------- helpers ---------- */
function truncate(s?: string, len = 10) {
  if (!s) return "";
  if (s.length <= len) return s;
  return s.slice(0, 6) + "…" + s.slice(-3);
}