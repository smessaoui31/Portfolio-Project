import type { Metadata } from "next";
import { connection } from "next/server";
import { MenuList } from "@/components/menu/MenuList";
import { now } from "@/lib/clock";
import { getMenu } from "@/server/catalog";

export const metadata: Metadata = {
  title: "La carte",
  description: "Pizzas au feu de bois, desserts et boissons. À emporter ou en livraison à Toulouse.",
};

export default async function CartePage() {
  await connection();
  const categories = await getMenu(now());
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 md:px-6">
      <header className="pt-10 pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-ember">Au feu de bois</p>
        <h1 className="font-display mt-3 text-6xl md:text-8xl">La carte</h1>
        <p className="mt-4 max-w-xl text-muted-2">
          Choisis la cuisson et les suppléments de chaque pizza. Retrait possible 15 minutes après ta commande.
        </p>
      </header>
      <MenuList categories={categories} />
    </div>
  );
}
