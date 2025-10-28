// Page d’accueil — Hero noir & blanc avec spotlight, logo et CTAs
import Image from "next/image";
import Link from "next/link";
import { Spotlight } from "@/components/theme/ui/Spotlight"; 
export const revalidate = 0;

export default function HomePage() {
  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-neutral-950 text-neutral-100">
      {/* Spotlight d’ambiance */}
      <Spotlight className="left-1/2 top-[-20%] -translate-x-1/2 opacity-60" fill="#fff" />

      {/* Déco : léger gradient radial au fond */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(60%_60%_at_50%_30%,#000_30%,transparent_70%)]"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 10%, rgba(255,255,255,0.06), rgba(255,255,255,0) 60%)",
        }}
      />

      <section className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-4 py-16 md:py-24">
        {/* Logo */}
        <div className="mb-8 grid place-items-center">
          <Image
            src="/ofrero-pizza-logo.png"
            alt="O’Frero Pizza"
            width={600}  // ~12rem
            height={600}
            className= /*"rounded-xl border border-neutral-800 bg-neutral-900*/ "object-contain p-2"
            priority
          />
        </div>
        
        {/* Titre & tagline */}
        <h1 className="text-center text-4xl font-semibold tracking-tight md:text-5xl">
          O’Frero Pizza
        </h1>
        <p className="mt-3 max-w-2xl text-center text-neutral-400">
          Pizzeria artisanale tenue par deux frères. Pâte maison, produits frais, cuisson soignée au feu de bois
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/menu"
            className="group relative inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-black shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(255,255,255,0.15)] focus:outline-none focus:ring-2 focus:ring-black/15"
          >
            Voir le menu
          </Link>

          <a
            href="tel:+33615805147"
            className="group relative inline-flex items-center justify-center rounded-md border border-neutral-700 bg-neutral-900/70 px-5 py-2.5 text-sm font-medium text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] transition-all duration-300 hover:bg-neutral-800 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/15"
          >
            Appeler — 06 15 80 51 47
          </a>
        </div>

        {/* Infos pratiques */}
        <div className="mt-10 grid w-full gap-3 sm:grid-cols-3">
          <InfoCard
            title="Horaires"
            content={
              <>
                Lun–Jeu : 11h30–13H30 / 18h00–22H00
                <br />
                Ven : 18h00–22H00
                <br />
                Samedi et Dimanche : 12h00-13H30 / 18h–22H00
              </>
            }
          />
          <InfoCard
            title="Adresse"
            content={
              <>
                288 Rue Henri Desbals
                <br />
                31100 Toulouse
              </>
            }
          />
          <InfoCard
            title="À emporter & livraison"
            content="Commandez en ligne et récupérez sur place — livraison disponible selon zone."
          />
        </div>
      </section>
    </main>
  );
}

function InfoCard({ title, content }: { title: string; content: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="text-sm uppercase tracking-wide text-neutral-400">{title}</div>
      <div className="mt-1 text-neutral-200">{content}</div>
    </div>
  );
}