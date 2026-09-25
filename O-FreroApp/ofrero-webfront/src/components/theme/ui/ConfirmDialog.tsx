"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
  loading?: boolean;
};

/** Remplace window.confirm()/alert() par une modale cohérente avec le thème de l'app. */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "destructive",
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-100 bg-background/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          role="alertdialog"
          className="fixed left-1/2 top-1/2 z-100 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-5 shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <div className="flex items-start gap-3">
            {variant === "destructive" && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold text-foreground">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  {description}
                </Dialog.Description>
              )}
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md border border-border px-3 py-2 text-sm text-foreground transition hover:bg-accent"
              >
                {cancelLabel}
              </button>
            </Dialog.Close>
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className={`rounded-md px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                variant === "destructive"
                  ? "bg-red-600 text-foreground hover:bg-red-500"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {loading ? "…" : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
