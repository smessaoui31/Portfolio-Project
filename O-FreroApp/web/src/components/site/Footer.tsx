import Link from "next/link";
import { connection } from "next/server";
import { groupServiceWindows } from "@/domain/hours";
import { now } from "@/lib/clock";
import { SITE } from "@/lib/site";
import { getServiceWindows } from "@/server/settings";

export async function Footer() {
  await connection();
  const hours = groupServiceWindows(await getServiceWindows());
  return (
    <footer className="border-t border-line bg-bg">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.2fr_1fr_1fr] md:px-6">
        <div>
          <p className="font-display text-3xl">{SITE.name}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-2">
            Pizzeria au feu de bois tenue par deux frères. À emporter ou en livraison, commande en ligne.
          </p>
          <p className="mt-5 text-sm text-muted-2">
            {SITE.address}
            <br />
            {SITE.postalCity}
          </p>
          <a href={SITE.phoneHref} className="mt-2 inline-block text-sm font-semibold text-fg underline-offset-4 hover:underline">
            {SITE.phoneDisplay}
          </a>
        </div>

        <div>
          <h2 className="text-xs uppercase tracking-[0.16em] text-muted">Horaires</h2>
          <dl className="mt-4 space-y-2 text-sm">
            {hours.map((h) => (
              <div key={h.days} className="flex justify-between gap-4 border-b border-line pb-2">
                <dt className="text-muted-2">{h.days}</dt>
                <dd className="text-right tabular-nums">{h.services}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h2 className="text-xs uppercase tracking-[0.16em] text-muted">Le site</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-2">
            <li><Link href="/carte" className="hover:text-fg">La carte</Link></li>
            <li><Link href="/editions" className="hover:text-fg">Les éditions</Link></li>
            <li><Link href="/compte" className="hover:text-fg">Mon compte</Link></li>
            <li><Link href="/mentions-legales" className="hover:text-fg">Mentions légales</Link></li>
            <li><Link href="/cgv" className="hover:text-fg">Conditions générales de vente</Link></li>
          </ul>
        </div>
      </div>
      <p className="border-t border-line px-4 py-5 text-center text-xs text-muted">
        © {now().getFullYear()} {SITE.name} · Toulouse
      </p>
    </footer>
  );
}
