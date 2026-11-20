/** Short vibration where the browser supports it (Android); silently ignored elsewhere. */
export function haptic(pattern: number | number[] = 8): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw without a recent user gesture.
  }
}
