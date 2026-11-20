export type RatingScore = 1 | 2 | 3;

export const RATING_LABELS: Record<RatingScore, string> = { 1: "Bof", 2: "Bon", 3: "Excellent" };

export const RATING_COMMENT_MAX = 280;
