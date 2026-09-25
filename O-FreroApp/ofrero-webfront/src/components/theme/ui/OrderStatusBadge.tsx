"use client";

export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "FAILED" | "CANCELLED";

const STATUS_MAP: Record<OrderStatus, { text: string; cls: string }> = {
  PENDING: { text: "En attente", cls: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
  PAID: { text: "Payée", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
  SHIPPED: { text: "Expédiée", cls: "border-sky-500/40 bg-sky-500/10 text-sky-300" },
  DELIVERED: { text: "Livrée", cls: "border-green-500/40 bg-green-500/10 text-green-300" },
  FAILED: { text: "Échouée", cls: "border-rose-500/40 bg-rose-500/10 text-rose-300" },
  CANCELLED: { text: "Annulée", cls: "border-border bg-secondary text-foreground" },
};

export default function OrderStatusBadge({ status }: { status: string }) {
  const m = STATUS_MAP[status as OrderStatus] ?? {
    text: status,
    cls: "border-border bg-secondary text-foreground",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition ${m.cls}`}
    >
      {m.text}
    </span>
  );
}
