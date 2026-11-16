import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { AddressBook } from "@/components/account/AddressBook";
import { ResendVerification, SignOutButton } from "@/components/account/AuthForms";
import { ReorderButton } from "@/components/account/ReorderButton";
import { EditionsGrid } from "@/components/home/EditionsArchive";
import { LoyaltyCard } from "@/components/home/LoyaltyCard";
import { STATUS_LABELS } from "@/domain/order-status";
import { now } from "@/lib/clock";
import { formatEuros } from "@/lib/money";
import { requireUser } from "@/lib/session";
import { formatParisDay } from "@/lib/time";
import { getOrderHistory } from "@/server/account-orders";
import { listAddresses } from "@/server/addresses";
import { getHomeData } from "@/server/catalog";
import { getLoyaltySummary } from "@/server/loyalty";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false } };

export default async function ComptePage({ searchParams }: PageProps<"/compte">) {
  await connection();
  const session = await requireUser("/compte");
  const { verifie } = await searchParams;
  const [loyalty, history, addresses, home] = await Promise.all([
    getLoyaltySummary(session.user.id),
    getOrderHistory(session.user.id),
    listAddresses(session.user.id),
    getHomeData(now()),
  ]);
  const editions = [
    ...(home.edition ? [{ id: home.edition.id, number: home.edition.number, name: home.edition.product.name, imageUrl: home.edition.product.imageUrl }] : []),
    ...home.past,
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ember">Mon compte</p>
          <h1 className="font-display mt-3 text-6xl md:text-7xl">Bonjour {session.user.name}</h1>
        </div>
        <SignOutButton />
      </div>

      {verifie === "1" ? (
        <p className="mt-6 rounded-2xl border border-ok/40 bg-ok/10 p-4 text-sm text-ok">
          Adresse confirmée. Tes commandes passées avec cette adresse sont rattachées à ton compte.
        </p>
      ) : null}

      {!session.user.emailVerified ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line-2 bg-surface p-4">
          <p className="text-sm text-muted-2">
            Confirme ton adresse e-mail pour rattacher tes commandes passées et leurs tampons.
          </p>
          <ResendVerification email={session.user.email} />
        </div>
      ) : null}

      <div className="mt-10 grid gap-12 md:grid-cols-[minmax(0,420px)_1fr]">
        <section aria-labelledby="fidelite">
          <h2 id="fidelite" className="font-display mb-5 text-4xl">Fidélité</h2>
          <LoyaltyCard balance={loyalty.balance} stampsForReward={loyalty.stampsForReward} signedIn />
        </section>

        <section aria-labelledby="collection">
          <h2 id="collection" className="font-display mb-5 text-4xl">Ma collection</h2>
          {editions.length > 0 ? (
            <EditionsGrid editions={editions} tastedIds={loyalty.tastedEditionIds} />
          ) : (
            <p className="text-muted-2">Les éditions apparaîtront ici.</p>
          )}
          <p className="mt-4 text-sm text-muted">
            {loyalty.tastedEditionIds.length} édition{loyalty.tastedEditionIds.length > 1 ? "s" : ""} goûtée
            {loyalty.tastedEditionIds.length > 1 ? "s" : ""}.
          </p>
        </section>
      </div>

      <section aria-labelledby="commandes" className="mt-16">
        <h2 id="commandes" className="font-display text-4xl">Mes commandes</h2>
        {history.length === 0 ? (
          <p className="mt-4 text-muted-2">
            Pas encore de commande.{" "}
            <Link href="/carte" className="font-semibold text-fg underline-offset-4 hover:underline">
              Voir la carte
            </Link>
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {history.map((o) => (
              <li key={o.id} className="grid gap-4 py-5 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="text-sm text-muted">
                    n°{String(o.number).padStart(4, "0")} · {formatParisDay(o.createdAt)} · {o.mode === "PICKUP" ? "À emporter" : "Livraison"} ·{" "}
                    {STATUS_LABELS[o.status]}
                  </p>
                  <p className="mt-1 font-semibold">{o.summary}</p>
                  <p className="text-sm text-muted-2 tabular-nums">{formatEuros(o.totalCents)}</p>
                </div>
                <div className="flex flex-wrap items-start gap-3">
                  <Link href={`/suivi/${o.trackingToken}`} className="pt-2 text-sm text-muted-2 underline-offset-4 hover:text-fg hover:underline">
                    Suivi
                  </Link>
                  <ReorderButton orderId={o.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="adresses" className="mt-16 max-w-2xl">
        <h2 id="adresses" className="font-display mb-5 text-4xl">Mes adresses</h2>
        <AddressBook addresses={addresses} />
      </section>
    </div>
  );
}
