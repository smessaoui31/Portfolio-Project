"use client";

import { useRouter } from "next/navigation";
import { markRefundedAction } from "@/app/actions/admin-orders";
import { Button } from "@/components/ui/Button";

export function RefundDoneButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-danger/50 bg-danger/10 p-4 text-sm text-danger">
      <span className="flex-1">Commande payée en ligne puis annulée : rembourse-la depuis le tableau de bord Stripe.</span>
      <Button
        variant="secondary"
        onClick={async () => {
          if (!window.confirm("Le remboursement a bien été fait dans Stripe ?")) return;
          await markRefundedAction(orderId);
          router.refresh();
        }}
      >
        Remboursement fait
      </Button>
    </div>
  );
}
