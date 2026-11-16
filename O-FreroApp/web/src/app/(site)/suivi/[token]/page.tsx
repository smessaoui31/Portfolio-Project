import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { TrackingView } from "@/components/order/TrackingView";
import { confirmPaymentFromReturn, getTracking } from "@/server/lifecycle";

export const metadata: Metadata = { title: "Suivi de commande", robots: { index: false, follow: false } };

export default async function SuiviPage({ params, searchParams }: PageProps<"/suivi/[token]">) {
  await connection();
  const { token } = await params;
  const query = await searchParams;
  const fromStripe = query.paye === "1";
  const paymentFailed = fromStripe && query.redirect_status === "failed";
  if (fromStripe && !paymentFailed) await confirmPaymentFromReturn(token);
  const view = await getTracking(token);
  if (!view) notFound();
  return (
    <div className="mx-auto max-w-xl px-4 py-10 md:py-14">
      <TrackingView
        token={token}
        initial={view}
        fresh={query.nouvelle === "1" || fromStripe}
        paid={fromStripe && !paymentFailed}
        paymentFailed={paymentFailed}
      />
    </div>
  );
}
