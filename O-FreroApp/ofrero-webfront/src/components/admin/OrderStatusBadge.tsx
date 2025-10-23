"use client";

export default function OrderStatusBadge({ status }: { status: string }) {
  const base =
    "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border transition";

  switch (status) {
    case "PENDING":
      return (
        <span className={`${base} border-amber-500/40 bg-amber-500/10 text-amber-300`}>
          En attente
        </span>
      );
    case "PAID":
      return (
        <span className={`${base} border-emerald-500/40 bg-emerald-500/10 text-emerald-300`}>
          Payée
        </span>
      );
    case "CANCELLED":
      return (
        <span className={`${base} border-red-500/40 bg-red-500/10 text-red-300`}>
          Annulée
        </span>
      );
    case "SHIPPED":
      return (
        <span className={`${base} border-sky-500/40 bg-sky-500/10 text-sky-300`}>
          Expédiée
        </span>
      );
    default:
      return (
        <span className={`${base} border-neutral-700 bg-neutral-800 text-neutral-300`}>
          {status}
        </span>
      );
  }
}