import Link from "next/link";
import { ProductImage } from "@/components/menu/ProductImage";

export interface ArchiveEdition {
  id: string;
  number: number;
  name: string;
  imageUrl: string | null;
}

export function EditionsGrid({ editions, tastedIds }: { editions: ArchiveEdition[]; tastedIds: string[] }) {
  return (
    <ul className="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-6">
      {editions.map((e) => {
        const tasted = tastedIds.includes(e.id);
        return (
          <li key={e.id} className="text-center">
            <div className={`mx-auto w-fit rounded-full ${tasted ? "ring-2 ring-ember ring-offset-4 ring-offset-bg" : ""}`}>
              <ProductImage src={e.imageUrl} alt="" size={96} className={tasted ? "" : "opacity-50 grayscale"} />
            </div>
            <p className={`mt-3 text-xs ${tasted ? "text-fg" : "text-muted"}`}>
              <span className="font-display block text-base tracking-wide">N°{String(e.number).padStart(2, "0")}</span>
              {e.name}
              {tasted ? <span className="sr-only"> (goûtée)</span> : null}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

export function EditionsArchive({
  editions,
  tastedIds,
  signedIn,
}: {
  editions: ArchiveEdition[];
  tastedIds: string[];
  signedIn: boolean;
}) {
  if (editions.length === 0) return null;
  return (
    <section aria-labelledby="editions-titre" className="border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <h2 id="editions-titre" className="font-display text-5xl md:text-6xl">Les éditions</h2>
            <p className="mt-3 text-muted-2">
              Une pizza événement tous les deux mois, puis elle disparaît.{" "}
              {signedIn ? "Celles que tu as goûtées restent en couleur." : "Avec un compte, celles que tu as goûtées restent en couleur."}
            </p>
          </div>
          <Link href="/editions" className="text-sm font-semibold underline-offset-4 hover:underline">
            Toutes les éditions →
          </Link>
        </div>
        <div className="mt-10">
          <EditionsGrid editions={editions.slice(0, 6)} tastedIds={tastedIds} />
        </div>
      </div>
    </section>
  );
}
