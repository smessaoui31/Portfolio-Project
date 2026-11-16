import type { FulfillmentMode, OrderStatus } from "./types";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "En attente de paiement",
  RECEIVED: "Reçue",
  IN_OVEN: "Au four",
  READY: "Prête",
  OUT_FOR_DELIVERY: "En livraison",
  COMPLETED: "Terminée",
  NOT_COLLECTED: "Non récupérée",
  CANCELLED: "Annulée",
  FAILED: "Paiement échoué",
};

export const TERMINAL_STATUSES: OrderStatus[] = ["COMPLETED", "NOT_COLLECTED", "CANCELLED", "FAILED"];

/** Transitions an admin can apply. RECEIVED and FAILED from PENDING_PAYMENT come from the payment webhook. */
export function nextStatuses(status: OrderStatus, mode: FulfillmentMode): OrderStatus[] {
  switch (status) {
    case "PENDING_PAYMENT":
      return ["CANCELLED"];
    case "RECEIVED":
      return ["IN_OVEN", "CANCELLED"];
    case "IN_OVEN":
      return mode === "PICKUP" ? ["READY", "CANCELLED"] : ["OUT_FOR_DELIVERY", "CANCELLED"];
    case "READY":
      return ["COMPLETED", "NOT_COLLECTED"];
    case "OUT_FOR_DELIVERY":
      return ["COMPLETED"];
    default:
      return [];
  }
}

export function trackingSteps(mode: FulfillmentMode): { status: OrderStatus; label: string }[] {
  return mode === "PICKUP"
    ? [
        { status: "RECEIVED", label: "Reçue" },
        { status: "IN_OVEN", label: "Au four" },
        { status: "READY", label: "Prête" },
        { status: "COMPLETED", label: "Récupérée" },
      ]
    : [
        { status: "RECEIVED", label: "Reçue" },
        { status: "IN_OVEN", label: "Au four" },
        { status: "OUT_FOR_DELIVERY", label: "En livraison" },
        { status: "COMPLETED", label: "Livrée" },
      ];
}
