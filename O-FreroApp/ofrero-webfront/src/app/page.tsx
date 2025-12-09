// Page d'accueil — Hero noir & blanc avec spotlight, logo et CTAs
import Image from "next/image";
import Link from "next/link";
import { Spotlight } from "@/components/theme/ui/Spotlight"; 
export const revalidate = 0;

export default function HomePage() {
  return (
    <main className="relative h-screen overflow-hidden bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Spotlight d'ambiance */}
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

      <section className="relative z-10 mx-auto flex flex-1 max-w-7xl flex-col items-center justify-evenly px-4 py-2">
        
        {/* Logo */}
        <div className="flex-shrink-0 grid place-items-center">
          <Image
            src="/ofrero-pizza-logo.png"
            alt="O'Frero Pizza"
            width={500}
            height={500}
            className="object-contain"
            priority
          />
        </div>
        
        {/* Titre & tagline */}
        <div className="flex-shrink-0 -mt-4">
          <h1 className="bg-opacity-50 bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-center text-3xl font-bold text-transparent md:text-5xl lg:text-5xl">
            O'Frero Pizza
          </h1>
          <p className="mx-auto mt-1 max-w-lg text-center text-sm font-normal text-neutral-300 md:text-base">
            Une Pizzeria artisanale au feu de bois, tenue par deux frères passionnés de la pizza façon italienne.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex-shrink-0 flex flex-col items-center gap-2.5 sm:flex-row">
          <Link
            href="/menu"
            className="group relative inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-black shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(255,255,255,0.15)] focus:outline-none focus:ring-2 focus:ring-black/15"
          >
            Voir la carte
          </Link>

          <a
            href="tel:+33615805147"
            className="group relative inline-flex items-center justify-center rounded-md border border-neutral-700 bg-neutral-900/70 px-5 py-2.5 text-sm font-medium text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] transition-all duration-300 hover:bg-neutral-800 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/15"
          >
            Appelez nous au 06 15 80 51 47
          </a>
        </div>

        {/* Infos pratiques */}
        <div className="flex-shrink-0 grid w-full gap-2.5 sm:grid-cols-3">
          <InfoCard
            title="Horaires"
            content={
              <>
                Lun–Jeu : 11h30–13H30 / 18h00–22H00
                <br />
                Ven : 18h00–22H00
                <br />
                Sam-Dim : 12h00-13H30 / 18h–22H00
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
            content="Commandez en ligne et récupérez sur place ou en livraison disponible selon zone."
          />
        </div>

      </section>

      {/* Footer intégré dans la page */}
      <footer className="relative z-10 border-t border-neutral-800/80 py-3 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} O'Frero Pizza — Fait par Messaoui Sofian
      </footer>
    </main>
  );
}

function InfoCard({ title, content }: { title: string; content: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-2.5">
      <div className="text-xs uppercase tracking-wide text-neutral-400">{title}</div>
      <div className="mt-0.5 text-sm text-neutral-200">{content}</div>
    </div>
  );
}