import type { Metadata } from "next";
import { PasswordReset } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Mot de passe", robots: { index: false } };

export default async function MotDePassePage({ searchParams }: PageProps<"/compte/mot-de-passe">) {
  const { token } = await searchParams;
  return <PasswordReset token={typeof token === "string" ? token : null} />;
}
