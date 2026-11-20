"use client";

import { useEffect } from "react";
import { saveReferralCode } from "@/lib/device-storage";

/** Keeps the ?parrain= code of a shared link for the sign-up form. Renders nothing. */
export function ReferralCapture() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("parrain");
    if (code && /^[A-Za-z0-9]{4,12}$/.test(code)) saveReferralCode(code.toUpperCase());
  }, []);
  return null;
}
