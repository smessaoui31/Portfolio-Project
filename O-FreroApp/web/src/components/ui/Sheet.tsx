"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useDragControls, type PanInfo } from "motion/react";
import { useEffect, useState, type PointerEvent, type ReactNode } from "react";
import { SHEET } from "@/components/motion/springs";

function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return desktop;
}

/**
 * Panel from the bottom on phones (pull it down to close), from the right from 768px.
 * Springs in and out; Radix keeps focus, Escape and the accessible name.
 */
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
  const desktop = useIsDesktop();
  const drag = useDragControls();
  const hidden = desktop ? { x: "100%", y: 0 } : { x: 0, y: "100%" };
  const startDrag = (event: PointerEvent) => {
    if (!desktop) drag.start(event);
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 650) onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                initial={hidden}
                animate={{ x: 0, y: 0 }}
                exit={hidden}
                transition={SHEET}
                drag={desktop ? false : "y"}
                dragControls={drag}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.7 }}
                onDragEnd={onDragEnd}
                className={[
                  "fixed z-50 flex flex-col bg-surface text-fg border-line-2 outline-none",
                  "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-3xl border-t",
                  "md:inset-y-0 md:right-0 md:left-auto md:bottom-auto md:h-dvh md:max-h-none md:w-[440px] md:rounded-none md:border-t-0 md:border-l",
                ].join(" ")}
              >
                <div className="touch-none pt-3 md:hidden" onPointerDown={startDrag} aria-hidden>
                  <div className="mx-auto h-1 w-10 rounded-full bg-line-2" />
                </div>
                <div className="flex items-start justify-between gap-4 px-5 pt-4 md:pt-6">
                  <div className="touch-none md:touch-auto" onPointerDown={startDrag}>
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
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
