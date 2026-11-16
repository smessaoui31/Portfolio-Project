"use server";

import { now } from "@/lib/clock";
import { getSession } from "@/lib/session";
import { reorderLines } from "@/server/account-orders";
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
