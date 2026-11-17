import type { ReactNode } from "react";
import { STATUS_LABELS } from "@/domain/order-status";
import type { OrderStatus } from "@/domain/types";

export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <h1 className="font-display text-5xl">{title}</h1>
      {children}
    </div>
  );
}

const STATUS_TONE: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "border-line-2 text-muted",
  RECEIVED: "border-ember text-ember",
  IN_OVEN: "border-[#f5b041] text-[#f5b041]",
  READY: "border-ok text-ok",
  OUT_FOR_DELIVERY: "border-ok text-ok",
  COMPLETED: "border-line-2 text-muted-2",
  NOT_COLLECTED: "border-danger text-danger",
  CANCELLED: "border-line-2 text-muted line-through",
  FAILED: "border-line-2 text-muted",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="font-display mt-2 text-4xl tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Card({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      {title || actions ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-2">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}
