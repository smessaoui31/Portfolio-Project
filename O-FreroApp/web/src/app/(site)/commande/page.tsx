import type { Metadata } from "next";
import { connection } from "next/server";
import { Checkout } from "@/components/order/Checkout";
import type { CheckoutAccount } from "@/components/order/types";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { getSession } from "@/lib/session";
import { getLoyaltySummary } from "@/server/loyalty";
import { isOnlinePaymentEnabled } from "@/server/payments";

export const metadata: Metadata = { title: "Commander", robots: { index: false } };

export default async function CommandePage() {
  await connection();
  const session = await getSession();
  let account: CheckoutAccount | null = null;
  if (session) {
    const [addresses, loyalty] = await Promise.all([
      prisma.address.findMany({
        where: { userId: session.user.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        select: { id: true, label: true, line1: true, line2: true, postalCode: true, city: true, isDefault: true },
      }),
      getLoyaltySummary(session.user.id),
    ]);
    account = {
      name: session.user.name,
      email: session.user.email,
      addresses,
      balance: loyalty.balance,
      stampsForReward: loyalty.stampsForReward,
    };
  }
  const onlinePayment = isOnlinePaymentEnabled();

  return (
    <div className="mx-auto max-w-xl px-4 py-10 md:py-14">
      <Checkout account={account} onlinePayment={onlinePayment} publishableKey={onlinePayment ? env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null : null} />
    </div>
  );
}
