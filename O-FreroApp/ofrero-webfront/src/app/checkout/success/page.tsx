// src/app/checkout/success/page.tsx
"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiAuthed } from "@/lib/api";

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

  useEffect(() => {
    if (!orderId) {
      setErr("Identifiant de commande manquant.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await apiAuthed<OrderDetail>(`/checkout/orders/${orderId}`);
        setOrder(data);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Impossible de charger la commande.");
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  const isPaid = order?.status === "PAID";
  const itemsCount = useMemo(
    () => (order?.items || []).reduce((n, it) => n + it.quantity, 0),
    [order]
  );

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8">
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
          <h1 className="text-white text-xl font-semibold">Une erreur est survenue</h1>
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
        className={`relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900/60 to-neutral-950/30 p-6 transition-all duration-700 ${
          ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        {/* Confetti minimal (subtil) */}
        <ConfettiSoft active={isPaid && ready} />

        <div className="flex items-start gap-5">
          {/* Médaillon animé */}
          <div className="relative">
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
            <h1 className="text-2xl font-semibold text-white">
              {isPaid ? "Paiement confirmé ✅" : "Commande reçue"}
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Merci pour votre commande — elle a bien été {isPaid ? "payée et validée" : "enregistrée"}.
            </p>
          </div>
        </div>

        {/* Carte de récapitulatif */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="col-span-2 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-neutral-400">Numéro de commande</div>
                <div className="mt-1 font-medium text-white">#{shortId}</div>
              </div>

              <div className="text-right">
                <div className="text-xs text-neutral-400">Montant payé</div>
                <div className="mt-1 text-xl font-semibold text-white">{formattedTotal} €</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-neutral-400">
              <div>{itemsCount} article{itemsCount > 1 ? "s" : ""}</div>
              <div>{new Date(order.createdAt).toLocaleString("fr-FR")}</div>
            </div>

            <div className="mt-3 flex items-center gap-3 text-sm">
              <div className="rounded-md bg-neutral-800/40 px-3 py-1 text-neutral-300">
                {paymentMethodLabel}
              </div>
              {order.payment?.intentId ? (
                <div className="text-xs text-neutral-400">
                  Transaction : {truncate(order.payment.intentId)}
                </div>
              ) : null}
            </div>
          </div>

          {/* Livraison */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
            <div className="text-xs text-neutral-400">Livraison</div>
            <div className="mt-1 text-sm text-white">
              {order.shippingLine1}
              {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}
            </div>
            <div className="mt-1 text-xs text-neutral-400">
              {order.shippingPostalCode} {order.shippingCity}
            </div>
            <div className="mt-3 text-xs text-neutral-400">Téléphone</div>
            <div className="mt-1 text-sm text-white">{order.shippingPhone}</div>
          </div>
        </div>
      </section>

      {/* Articles */}
      <section
        className={`mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 transition-all duration-700 delay-100 ${
          ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        <h2 className="text-white font-medium mb-4">Résumé de votre commande</h2>
        <ul className="divide-y divide-neutral-800">
          {order.items.map((it) => (
            <li key={it.id} className="py-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm text-white">{it.name}</div>
                <div className="text-xs text-neutral-400">
                  {(it.unitPriceCents / 100).toFixed(2)} € × {it.quantity}
                </div>
              </div>
              <div className="text-sm text-white font-medium">
                {((it.unitPriceCents * it.quantity) / 100).toFixed(2)} €
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-neutral-800 pt-3">
          <span className="text-neutral-400 text-sm">Total</span>
          <span className="text-white font-semibold">{formattedTotal} €</span>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-neutral-400">
            Un e-mail de confirmation a été envoyé à votre adresse.
          </div>
          <div className="flex gap-2">
            <Link
              href="/orders"
              className="rounded-md border border-neutral-800 px-3 py-2 text-sm text-white hover:bg-neutral-800/60"
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
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8">
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

function ConfettiSoft({ active }: { active: boolean }) {
  if (!active) return null;
  // Confetti très minimaliste pour rester premium et léger
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="confetti c1" />
      <span className="confetti c2" />
      <span className="confetti c3" />
      <span className="confetti c4" />
      <style jsx>{`
        .confetti {
          position: absolute;
          top: -8px;
          width: 6px;
          height: 10px;
          opacity: 0;
          border-radius: 2px;
          animation: fall 900ms ease-out forwards;
        }
        .c1 {
          left: 12%;
          background: rgba(16, 185, 129, 0.9);
          transform: rotate(12deg);
          animation-delay: 80ms;
        }
        .c2 {
          left: 24%;
          background: rgba(99, 102, 241, 0.9);
          transform: rotate(-8deg);
          animation-delay: 120ms;
        }
        .c3 {
          left: 68%;
          background: rgba(236, 72, 153, 0.9);
          transform: rotate(18deg);
          animation-delay: 160ms;
        }
        .c4 {
          left: 82%;
          background: rgba(250, 204, 21, 0.9);
          transform: rotate(-16deg);
          animation-delay: 200ms;
        }
        @keyframes fall {
          0% {
            opacity: 0;
            transform: translateY(-6px) scale(0.9) rotate(var(--rot, 0deg));
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(32px) scale(1) rotate(calc(var(--rot, 0deg) + 40deg));
          }
        }
      `}</style>
    </div>
  );
}

/* ---------- helpers ---------- */
function truncate(s?: string, len = 10) {
  if (!s) return "";
  if (s.length <= len) return s;
  return s.slice(0, 6) + "…" + s.slice(-3);
}