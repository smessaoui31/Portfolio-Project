"use client";

import { Toaster } from "sonner";

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-left"     // affiché juste sous la navbar
      richColors
      expand
      duration={2500}
      theme="dark"
      closeButton
    />
  );
}