import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { EditionsGrid } from "@/components/home/EditionsArchive";
import { OrderProductButton } from "@/components/home/OrderProductButton";
import { ProductSheetProvider } from "@/components/home/ProductSheetProvider";
import { ProductImage } from "@/components/menu/ProductImage";
import { buttonClasses } from "@/components/ui/Button";
import { editionLabel } from "@/domain/editions";
import { now } from "@/lib/clock";
import { getSession } from "@/lib/session";
import { getHomeData } from "@/server/catalog";
import { getLoyaltySummary } from "@/server/loyalty";

export const metadata: Metadata = {
  title: "Les éditions",
  description: "Une pizza événement tous les deux mois, puis elle disparaît. Retrouve toutes les éditions O'Frero.",
};

export default async function EditionsPage() {
  await connection();
  const [home, session] = await Promise.all([getHomeData(now()), getSession()]);
  const tasted = session ? (await getLoyaltySummary(session.user.id)).tastedEditionIds : [];
  const current = home.edition;

  return (
    <ProductSheetProvider>
      <div className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
        <header className="pt-10 pb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-ember">Une pizza, deux mois</p>
          <h1 className="font-display mt-3 text-6xl md:text-8xl">Les éditions</h1>
          <p className="mt-4 max-w-2xl text-muted-2">
            Tous les deux mois, les frères sortent une pizza qu&apos;on ne trouve nulle part ailleurs. Quand l&apos;édition
            se termine, elle quitte la carte. Avec un compte, chaque édition goûtée rejoint ta collection.
          </p>
        </header>

        {current ? (
          <section aria-labelledby="edition-en-cours" className="grid items-center gap-8 rounded-3xl border border-line-2 bg-surface p-6 md:grid-cols-[auto_1fr] md:p-10">
            <ProductImage src={current.product.imageUrl} alt={current.product.name} size={220} className="mx-auto spin-slow" />
            <div>
              <p className="font-display text-sm tracking-[0.22em] text-ember">
                En ce moment · Édition {editionLabel(current).number} · {editionLabel(current).long}
              </p>
              <h2 id="edition-en-cours" className="font-display mt-3 text-5xl md:text-7xl">
                {current.product.name}
              </h2>
              <p className="mt-3 max-w-lg text-muted-2">{current.product.description}</p>
              <p className="mt-4 max-w-lg italic text-fg">« {current.brothersNote} »</p>
              <div className="mt-6">
                <OrderProductButton product={current.product} />
              </div>
            </div>
          </section>
        ) : null}

        <section aria-labelledby="archives" className="pt-16">
          <h2 id="archives" className="font-display text-4xl md:text-5xl">Les éditions passées</h2>
          {home.past.length > 0 ? (
            <div className="mt-8">
              <EditionsGrid editions={home.past} tastedIds={tasted} />
            </div>
          ) : (
            <p className="mt-4 text-muted-2">La première édition est en cours.</p>
          )}
          {!session ? (
            <Link href="/compte/inscription" className={buttonClasses("secondary", "lg", "mt-10")}>
              Créer mon compte pour collectionner
            </Link>
          ) : null}
        </section>
      </div>
    </ProductSheetProvider>
  );
}
