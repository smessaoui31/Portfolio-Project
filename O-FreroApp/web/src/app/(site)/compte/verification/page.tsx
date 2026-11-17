import type { Metadata } from "next";
import Link from "next/link";
import { ResendVerification } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Vérifie ton adresse", robots: { index: false } };

export default async function VerificationPage({ searchParams }: PageProps<"/compte/verification">) {
  const { email } = await searchParams;
  const address = typeof email === "string" ? email : "";
  return (
    <div className="mx-auto max-w-md px-4 py-12 md:py-16">
      <h1 className="font-display text-5xl md:text-6xl">Vérifie ta boîte mail</h1>
      <p className="mt-4 text-muted-2">
        Un lien de confirmation vient de partir{address ? ` à ${address}` : ""}. Tes commandes passées avec cette adresse seront
        rattachées à ton compte, avec leurs tampons, dès que tu l&apos;auras ouvert.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <ResendVerification email={address} />
        <Link href="/compte" className="text-sm font-semibold underline-offset-4 hover:underline">
          Aller à mon compte
        </Link>
      </div>
    </div>
  );
}
