"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { advanceOrderAction } from "@/app/actions/admin-orders";
import { Button } from "@/components/ui/Button";
import { nextStatuses } from "@/domain/order-status";
import type { FulfillmentMode, OrderStatus } from "@/domain/types";

function actionLabel(to: OrderStatus, mode: FulfillmentMode): string {
  switch (to) {
    case "IN_OVEN":
      return "Mettre au four";
    case "READY":
      return "Prête";
    case "OUT_FOR_DELIVERY":
      return "Partie en livraison";
    case "COMPLETED":
      return mode === "PICKUP" ? "Récupérée" : "Livrée";
    case "NOT_COLLECTED":
      return "Non récupérée";
    case "CANCELLED":
      return "Annuler la commande";
    default:
      return to;
  }
}

export function StatusActions({ orderId, status, mode }: { orderId: string; status: OrderStatus; mode: FulfillmentMode }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = nextStatuses(status, mode);
  if (options.length === 0) return <p className="text-sm text-muted">Commande terminée.</p>;

  async function apply(to: OrderStatus) {
    if (to === "CANCELLED" && !window.confirm("Annuler cette commande ? Le stock et la pizza offerte seront rendus.")) return;
    setBusy(true);
    const result = await advanceOrderAction(orderId, to);
    setBusy(false);
    setError(result.ok ? null : (result.message ?? null));
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((to) => (
          <Button
            key={to}
            size="lg"
            variant={to === "CANCELLED" || to === "NOT_COLLECTED" ? "secondary" : "primary"}
            disabled={busy}
            onClick={() => apply(to)}
          >
            {actionLabel(to, mode)}
          </Button>
        ))}
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
