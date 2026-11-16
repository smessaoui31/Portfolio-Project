import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/account/AuthForms";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function ConnexionPage({ searchParams }: PageProps<"/compte/connexion">) {
  if (await getSession()) redirect("/compte");
  const { suite } = await searchParams;
  return <SignInForm next={typeof suite === "string" ? suite : null} />;
}
