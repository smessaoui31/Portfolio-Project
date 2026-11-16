"use server";

import { ordersLinkEmail } from "@/emails/templates";
import { now } from "@/lib/clock";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { getSession } from "@/lib/session";
import { reorderLines } from "@/server/account-orders";
import { createOrdersLinkToken } from "@/server/accounts";
import { deleteAddress, saveAddress, setDefaultAddress, type AddressInput } from "@/server/addresses";
import type { DescribedLine } from "@/server/cart";

export async function reorderAction(orderId: string): Promise<{ lines: DescribedLine[]; skipped: string[] } | null> {
  const session = await getSession();
  if (!session) return null;
  return reorderLines(session.user.id, orderId, now());
}

export async function saveAddressAction(input: AddressInput) {
  const session = await getSession();
  if (!session) return { ok: false as const, message: "Connecte-toi pour enregistrer une adresse." };
  return saveAddress(session.user.id, input);
}

export async function deleteAddressAction(id: string): Promise<void> {
  const session = await getSession();
  if (session) await deleteAddress(session.user.id, id);
}

export async function setDefaultAddressAction(id: string): Promise<void> {
  const session = await getSession();
  if (session) await setDefaultAddress(session.user.id, id);
}

/** E-mails a link that attaches past guest orders when opened while signed in. */
export async function requestOrdersLinkAction(): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) return { ok: false };
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, emailVerified: true, ordersLinkedAt: true } });
  if (!user?.emailVerified || user.ordersLinkedAt) return { ok: false };
  const token = createOrdersLinkToken(session.user.id, user.email, now());
  await sendEmail({ to: user.email, ...ordersLinkEmail(`${env.BETTER_AUTH_URL.replace(/\/$/, "")}/compte/rattacher?jeton=${encodeURIComponent(token)}`) });
  return { ok: true };
}
