"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { reorderAction } from "@/app/actions/account";
import { useCart } from "@/components/cart/cart-store";
import { Button } from "@/components/ui/Button";
import { markReorder } from "@/lib/device-storage";

export function ReorderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const [skipped, setSkipped] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function reorder() {
    setBusy(true);
    const result = await reorderAction(orderId);
    setBusy(false);
    if (!result) return;
    result.lines.forEach((line) => add(line));
    markReorder();
    if (result.skipped.length === 0) router.push("/commande");
    else setSkipped(result.skipped);
  }

  return (
    <div>
      <Button variant="secondary" onClick={reorder} disabled={busy}>
        {busy ? "Ajout…" : "Recommander pareil"}
      </Button>
      {skipped ? (
        <p className="mt-2 text-sm text-muted-2">
          Plus disponible : {skipped.join(", ")}.{" "}
          <Link href="/commande" className="font-semibold text-fg underline-offset-4 hover:underline">
            Continuer avec le reste
          </Link>
        </p>
      ) : null}
    </div>
  );
}
