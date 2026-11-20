import Link from "next/link";
import { PizzaStampCard } from "@/components/loyalty/PizzaStampCard";
import { buttonClasses } from "@/components/ui/Button";

/** The stamp card. Guests see an empty card and the sign-up invitation. */
export function LoyaltyCard({
  balance,
  stampsForReward,
  signedIn,
  onAccountPage = false,
}: {
  balance: number;
  stampsForReward: number;
  signedIn: boolean;
  onAccountPage?: boolean;
}) {
  const filled = Math.min(balance, stampsForReward);
  const remaining = Math.max(0, stampsForReward - balance);
  const ready = signedIn && remaining === 0;

  return (
    <div className="rounded-3xl bg-fg p-6 text-ember-ink md:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-display text-4xl tabular-nums">
          {filled} / {stampsForReward}
        </p>
        <p className="text-sm font-medium">
          {!signedIn
            ? "Une commande à emporter, un tampon"
            : ready
              ? "Ta pizza offerte t'attend"
              : `Plus que ${remaining} commande${remaining > 1 ? "s" : ""}`}
        </p>
      </div>
      <div className="mt-5 rounded-2xl bg-ember-ink p-4">
        <PizzaStampCard filled={filled} total={stampsForReward} />
      </div>
      {signedIn && onAccountPage && !ready ? null : signedIn ? (
        <Link href={ready ? "/carte" : "/compte"} className={buttonClasses("primary", "lg", "mt-6 w-full !bg-ember-ink !text-fg")}>
          {ready ? "Choisir ma pizza offerte" : "Voir mon compte"}
        </Link>
      ) : (
        <Link href="/compte/inscription" className={buttonClasses("primary", "lg", "mt-6 w-full !bg-ember-ink !text-fg")}>
          Créer mon compte
        </Link>
      )}
    </div>
  );
}
