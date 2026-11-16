"use server";

import type { OrderStatus } from "@/domain/types";
import { requireAdmin } from "@/lib/session";
import { advanceOrderStatus } from "@/server/lifecycle";

export async function advanceOrderAction(orderId: string, to: OrderStatus): Promise<{ ok: boolean; message?: string }> {
  const session = await requireAdmin();
  const result = await advanceOrderStatus(orderId, to, session.user.email);
  if (result.ok) return { ok: true };
  return {
    ok: false,
    message: result.error === "NOT_FOUND" ? "Commande introuvable." : "Ce changement n'est plus possible : la page a été mise à jour.",
  };
}
