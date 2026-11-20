/** Shared spring settings, so every interaction moves with the same feel. */
export const SNAPPY = { type: "spring", stiffness: 520, damping: 34 } as const;
export const POP = { type: "spring", stiffness: 700, damping: 17 } as const;
export const SHEET = { type: "spring", stiffness: 380, damping: 38 } as const;
export const ROLL = { type: "spring", stiffness: 300, damping: 28 } as const;
