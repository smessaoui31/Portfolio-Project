"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

/** Panel from the bottom on phones, from the right from 768px. */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]" />
        <Dialog.Content
          className={[
            "fixed z-50 flex flex-col bg-surface text-fg border-line-2 outline-none",
            "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-3xl border-t",
            "md:inset-y-0 md:right-0 md:left-auto md:bottom-auto md:h-dvh md:max-h-none md:w-[440px] md:rounded-none md:border-t-0 md:border-l",
          ].join(" ")}
        >
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-line-2 md:hidden" aria-hidden />
          <div className="flex items-start justify-between gap-4 px-5 pt-4 md:pt-6">
            <div>
              <Dialog.Title className="font-display text-3xl">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-2 text-sm text-muted-2">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="grid size-10 shrink-0 place-items-center rounded-full border border-line-2 text-muted-2 hover:text-fg"
              aria-label="Fermer"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer ? <div className="border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
