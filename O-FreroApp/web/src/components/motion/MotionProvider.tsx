"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { CartFxLayer } from "./CartFx";

/** Honors "reduce motion" for every Motion animation and hosts the add-to-cart effects. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
      <CartFxLayer />
    </MotionConfig>
  );
}
