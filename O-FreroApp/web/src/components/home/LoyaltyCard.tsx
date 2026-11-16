import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";

/** The stamp card. Guests see an empty card and the sign-up invitation. */
export function LoyaltyCard({ balance, stampsForReward, signedIn }: { balance: number; stampsForReward: number; signedIn: boolean }) {
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
            ? "Une pizza, un tampon"
            : ready
              ? "Ta pizza offerte t'attend"
              : `Plus que ${remaining} pizza${remaining > 1 ? "s" : ""}`}
        </p>
      </div>
      <ol className="mt-5 grid grid-cols-5 gap-2.5 md:gap-3" aria-label={`${filled} tampons sur ${stampsForReward}`}>
        {Array.from({ length: stampsForReward }, (_, i) => {
          const on = i < filled;
          const last = i === stampsForReward - 1;
          return (
            <li
              key={i}
              className={`grid aspect-square place-items-center rounded-full text-xs font-bold ${
                on ? "bg-ember text-ember-ink" : last ? "border-2 border-ember-ink" : "border-[1.5px] border-dashed border-[#b9a58f]"
              }`}
            >
              {on ? (
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                  <path d="M2.5 7.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : last ? (
                stampsForReward
              ) : null}
            </li>
          );
        })}
      </ol>
      {signedIn ? (
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
