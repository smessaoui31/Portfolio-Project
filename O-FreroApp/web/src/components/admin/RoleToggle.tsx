"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setUserRoleAction } from "@/app/actions/admin-settings";
import { Button } from "@/components/ui/Button";

export function RoleToggle({ userId, role }: { userId: string; role: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const isAdmin = role === "ADMIN";
  return (
    <div className="space-y-2">
      <Button
        variant="secondary"
        onClick={async () => {
          if (!window.confirm(isAdmin ? "Retirer les droits d'administration ?" : "Donner les droits d'administration ?")) return;
          const result = await setUserRoleAction(userId, isAdmin ? "USER" : "ADMIN");
          setError(result.ok ? null : result.message);
          router.refresh();
        }}
      >
        {isAdmin ? "Retirer les droits admin" : "Rendre administrateur"}
      </Button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
