import type { ReactNode } from "react";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 md:px-6">
      <h1 className="font-display text-5xl md:text-6xl">{title}</h1>
      <p className="mt-3 text-sm text-muted">Dernière mise à jour : {updated}</p>
      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-muted-2 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-fg [&_strong]:text-fg">
        {children}
      </div>
    </article>
  );
}

/** Marks text the owners must fill in before going live. */
export function ToComplete({ children }: { children: ReactNode }) {
  return <mark className="rounded bg-ember/15 px-1 text-ember">À compléter : {children}</mark>;
}
