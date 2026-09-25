"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";

export default function ToasterProvider() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="top-left"     // affiché juste sous la navbar
      richColors
      expand
      duration={2500}
      theme={resolvedTheme === "light" ? "light" : "dark"}
      closeButton
    />
  );
}