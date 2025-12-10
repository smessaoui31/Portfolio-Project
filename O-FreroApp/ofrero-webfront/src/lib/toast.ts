// Simple toast notification helper
// This is a simplified version - for a full implementation,
// you'd want to use a toast context/provider

type ToastType = "success" | "error" | "info";

export function showToast(message: string, type: ToastType = "info") {
  // For now, use browser alert as fallback
  // In a complete implementation, this would trigger a toast component
  if (typeof window !== "undefined") {
    const prefix = type === "success" ? "✓" : type === "error" ? "✗" : "ℹ";
    console.log(`[Toast ${type}] ${message}`);

    // Simple visual feedback using alert for now
    // TODO: Implement proper toast with Radix UI Toast component
    if (type === "error") {
      alert(`${prefix} ${message}`);
    } else {
      // For success/info, just log to console to avoid too many alerts
      console.info(`${prefix} ${message}`);
    }
  }
}
