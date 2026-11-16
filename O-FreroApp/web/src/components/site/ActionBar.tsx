"use client";

import Link from "next/link";
import { SITE } from "@/lib/site";
import { PhoneIcon } from "./icons";

export type ActionBarPrimary = {
  label: string;
  detail?: string;
  disabled?: boolean;
} & ({ href: string; onClick?: never } | { onClick: () => void; href?: never });

/** Fixed bar on phones: the main action plus a call button. Hidden from 768px. */
export function ActionBar({ primary }: { primary: ActionBarPrimary }) {
  const classes = `flex h-14 flex-1 items-center justify-between gap-3 rounded-2xl bg-ember px-5 text-[15px] font-bold text-ember-ink shadow-[0_10px_30px_-10px_rgba(255,90,31,0.6)] transition active:brightness-95 ${
    primary.disabled ? "pointer-events-none opacity-40" : ""
  }`;
  const content = (
    <>
      <span>{primary.label}</span>
      {primary.detail ? <span className="tabular-nums">{primary.detail}</span> : null}
    </>
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="flex gap-2">
        {primary.href ? (
          <Link href={primary.href} className={classes} aria-disabled={primary.disabled || undefined}>
            {content}
          </Link>
        ) : (
          <button type="button" onClick={primary.onClick} disabled={primary.disabled} className={classes}>
            {content}
          </button>
        )}
        <a
          href={SITE.phoneHref}
          aria-label={`Appeler la pizzeria au ${SITE.phoneDisplay}`}
          className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-line-2 bg-surface-2 text-fg"
        >
          <PhoneIcon />
        </a>
      </div>
    </div>
  );
}
