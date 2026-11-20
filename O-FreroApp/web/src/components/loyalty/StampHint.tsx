"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loyaltyHintAction } from "@/app/actions/cart";
import { stampHint } from "@/domain/loyalty-hint";
import type { FulfillmentMode } from "@/domain/types";

type Loyalty = { signedIn: boolean; balance: number; stampsForReward: number };

/** One line about stamps, under the cart total or in the details step. */
export function StampHint({
  mode,
  loyalty: given,
  usingReward = false,
}: {
  mode: FulfillmentMode | null;
  loyalty?: Loyalty;
  usingReward?: boolean;
}) {
  const [fetched, setFetched] = useState<Loyalty | null>(null);
  useEffect(() => {
    if (given) return;
    let alive = true;
    loyaltyHintAction().then((l) => {
      if (alive) setFetched(l);
    });
    return () => {
      alive = false;
    };
  }, [given]);

  const loyalty = given ?? fetched;
  if (!loyalty) return null;
  const text = stampHint({ ...loyalty, mode, usingReward });
  if (!text) return null;
  return (
    <p className="text-sm text-muted-2">
      {text}
      {!loyalty.signedIn ? (
        <>
          {" "}
          <Link href="/compte/inscription" className="font-semibold text-fg underline-offset-4 hover:underline">
            Créer mon compte
          </Link>
        </>
      ) : null}
    </p>
  );
}
