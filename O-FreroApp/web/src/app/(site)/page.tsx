import { ButtonLink } from "@/components/ui/Button";

// Temporary home until the edition poster lands (task 11).
export default function HomePage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 md:px-6">
      <p className="text-xs uppercase tracking-[0.2em] text-ember">O&apos;Frero Pizza</p>
      <h1 className="font-display mt-4 text-6xl md:text-8xl">Au feu de bois</h1>
      <ButtonLink href="/carte" size="lg" className="mt-8">
        Voir la carte
      </ButtonLink>
    </section>
  );
}
