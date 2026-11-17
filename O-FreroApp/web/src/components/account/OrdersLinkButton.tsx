"use client";

import { useState } from "react";
import { requestOrdersLinkAction } from "@/app/actions/account";
import { Button } from "@/components/ui/Button";

export function OrdersLinkButton() {
  const [sent, setSent] = useState(false);
  return (
    <Button
      variant="secondary"
      disabled={sent}
      onClick={async () => {
        const result = await requestOrdersLinkAction();
        setSent(result.ok);
      }}
    >
      {sent ? "Lien envoyé" : "Recevoir le lien"}
    </Button>
  );
}
