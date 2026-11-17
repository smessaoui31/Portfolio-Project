import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { now } from "@/lib/clock";
import { requireUser } from "@/lib/session";
import { redeemOrdersLink } from "@/server/accounts";

export const metadata: Metadata = { title: "Rattacher mes commandes", robots: { index: false } };

export default async function RattacherPage({ searchParams }: PageProps<"/compte/rattacher">) {
  const { jeton } = await searchParams;
  const token = typeof jeton === "string" ? jeton : "";
  const session = await requireUser(`/compte/rattacher?jeton=${encodeURIComponent(token)}`);
  if (token && (await redeemOrdersLink(token, session.user, now()))) redirect("/compte?rattache=1");
  return (
    <div className="mx-auto max-w-md px-4 py-12 md:py-16">
      <h1 className="font-display text-5xl">Lien invalide</h1>
      <p className="mt-4 text-muted-2">
        Ce lien a expiré ou appartient à un autre compte. Demande un nouveau lien depuis ton compte, puis ouvre-le en étant connecté.
      </p>
      <Link href="/compte" className="mt-6 inline-block font-semibold underline-offset-4 hover:underline">
        Aller à mon compte
      </Link>
    </div>
  );
}
