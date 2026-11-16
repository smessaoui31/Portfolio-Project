import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AutoPrint } from "@/components/admin/AutoPrint";
import { COOKING_LABELS } from "@/domain/types";
import { formatEuros } from "@/lib/money";
import { SITE } from "@/lib/site";
import { formatParisDay, formatParisTime } from "@/lib/time";
import { getAdminOrder } from "@/server/admin/orders";

/** 80 mm receipt for the kitchen printer. */
export default async function TicketPage({ params }: PageProps<"/admin/commandes/[id]/ticket">) {
  await connection();
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();
  const toCollect = order.paymentMethod === "AT_PICKUP";

  return (
    <div className="mx-auto w-[80mm] bg-white p-3 font-mono text-[12px] leading-snug text-black print:p-0">
      <style>{"@page { size: 80mm auto; margin: 4mm; } @media print { body { background: #fff !important; } }"}</style>
      <AutoPrint />
      <p className="text-center text-base font-bold">{SITE.name.toUpperCase()}</p>
      <p className="text-center">{SITE.phoneDisplay}</p>
      <hr className="my-2 border-dashed border-black" />
      <p className="text-lg font-bold">n°{String(order.number).padStart(4, "0")}</p>
      <p className="text-lg font-bold">
        {order.mode === "PICKUP" ? "RETRAIT" : "LIVRAISON"} {formatParisTime(order.slotAt)}
      </p>
      <p>{formatParisDay(order.slotAt)}</p>
      <hr className="my-2 border-dashed border-black" />
      <p className="font-bold">{order.customerFirstName}</p>
      <p>{order.customerPhone}</p>
      {order.mode === "DELIVERY" ? (
        <p>
          {order.addressLine1}
          {order.addressLine2 ? <><br />{order.addressLine2}</> : null}
          <br />
          {order.postalCode} {order.city}
        </p>
      ) : null}
      <hr className="my-2 border-dashed border-black" />
      {order.items.map((item) => (
        <div key={item.id} className="mb-1.5">
          <p className="font-bold">
            {item.quantity} x {item.name}
            {item.isReward ? " (1 OFFERTE)" : ""}
          </p>
          {item.cooking !== "NORMAL" ? <p>  {COOKING_LABELS[item.cooking].toUpperCase()}</p> : null}
          {item.supplements.map((s) => (
            <p key={s.id}>  + {s.name}</p>
          ))}
        </div>
      ))}
      <hr className="my-2 border-dashed border-black" />
      {order.deliveryFeeCents > 0 ? <p>Livraison : {formatEuros(order.deliveryFeeCents)}</p> : null}
      {order.rewardCents > 0 ? <p>Pizza offerte : -{formatEuros(order.rewardCents)}</p> : null}
      <p className="text-base font-bold">TOTAL {formatEuros(order.totalCents)}</p>
      <p className="mt-1 text-base font-bold">{toCollect ? "À ENCAISSER" : "PAYÉ EN LIGNE"}</p>
      <hr className="my-2 border-dashed border-black" />
      <p className="text-center">Merci et à bientôt</p>
    </div>
  );
}
