import { connection } from "next/server";
import { EditionPoster, type PosterEdition } from "@/components/home/EditionPoster";
import { EditionsArchive } from "@/components/home/EditionsArchive";
import { HomeActionBar } from "@/components/home/HomeActionBar";
import { LoyaltyCard } from "@/components/home/LoyaltyCard";
import { MenuPreview } from "@/components/home/MenuPreview";
import { ProductSheetProvider } from "@/components/home/ProductSheetProvider";
import { ReorderCard } from "@/components/home/ReorderCard";
import { VisitInfo } from "@/components/home/VisitInfo";
import { editionLabel, editionProgress } from "@/domain/editions";
import { groupServiceWindows } from "@/domain/hours";
import { categoryAnchor } from "@/lib/anchors";
import { now } from "@/lib/clock";
import { getSession } from "@/lib/session";
import { getHomeData, getMenu } from "@/server/catalog";
import { getLoyaltySummary } from "@/server/loyalty";
import { getLastAccountOrderSummary } from "@/server/reorder";
import { getServiceWindows, getSettings } from "@/server/settings";

export default async function HomePage() {
  await connection();
  const at = now();
  const [home, menu, windows, session, settings] = await Promise.all([
    getHomeData(at),
    getMenu(at),
    getServiceWindows(),
    getSession(),
    getSettings(),
  ]);
  const [loyalty, lastAccountOrder] = session
    ? await Promise.all([getLoyaltySummary(session.user.id), getLastAccountOrderSummary(session.user.id)])
    : [null, null];

  const product = home.edition?.product ?? home.featured;
  let poster: PosterEdition | null = null;
  if (home.edition) {
    const label = editionLabel(home.edition);
    const progress = editionProgress(home.edition, at);
    poster = {
      number: home.edition.number,
      numberLabel: label.number,
      monthsShort: label.short,
      monthsLong: label.long,
      endsAt: home.edition.endsAt,
      serverNow: at,
      dayIndex: progress.dayIndex,
      totalDays: progress.totalDays,
      ratio: progress.ratio,
    };
  }

  return (
    <ProductSheetProvider>
      <ReorderCard account={lastAccountOrder} />
      {product ? <EditionPoster product={product} edition={poster} /> : null}

      {home.edition ? (
        <section aria-label="Le mot des frères" className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Le mot des frères</p>
          <blockquote className="mt-4 max-w-3xl text-2xl leading-snug text-fg md:text-4xl">
            « {home.edition.brothersNote} »
          </blockquote>
        </section>
      ) : null}

      <div className="border-t border-line">
        <MenuPreview products={home.preview} categories={menu.map((c) => ({ name: c.name, href: `/carte#${categoryAnchor(c.name)}` }))} />
      </div>

      <EditionsArchive editions={home.past} tastedIds={loyalty?.tastedEditionIds ?? []} signedIn={Boolean(session)} />

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-14 px-4 py-14 md:grid-cols-2 md:gap-16 md:px-6 md:py-20">
          <div>
            <h2 className="font-display text-5xl md:text-6xl">Ta carte de fidélité</h2>
            <p className="mt-3 mb-8 text-muted-2">
              Une pizza achetée, un tampon. Au bout de {settings.stampsForReward} tampons, la pizza suivante est offerte. Le
              compte est facultatif, mais il garde tes tampons et tes commandes.
            </p>
            <LoyaltyCard
              balance={loyalty?.balance ?? 0}
              stampsForReward={loyalty?.stampsForReward ?? settings.stampsForReward}
              signedIn={Boolean(session)}
            />
          </div>
          <VisitInfo hours={groupServiceWindows(windows)} />
        </div>
      </section>

      {product ? <HomeActionBar product={product} /> : null}
    </ProductSheetProvider>
  );
}
