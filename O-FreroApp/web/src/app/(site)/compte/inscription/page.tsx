import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/account/AuthForms";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Créer un compte", robots: { index: false } };

export default async function InscriptionPage({ searchParams }: PageProps<"/compte/inscription">) {
  if (await getSession()) redirect("/compte");
  const { email } = await searchParams;
  return <SignUpForm defaultEmail={typeof email === "string" ? email : ""} />;
}
