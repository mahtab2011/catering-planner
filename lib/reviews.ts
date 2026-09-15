import type { ReviewDoc } from "./types";

/**
 * Pure, dependency-free review aggregation helpers. Kept separate from
 * any Firestore/component code so this logic can be unit tested on its
 * own once a test runner is added to the project (none exists yet —
 * see docs/SECURITY-FOLLOWUP.md and the implementation report for why
 * this wasn't added in this pass).
 */

export function averageRating(reviews: Pick<ReviewDoc, "rating">[]): number {
  if (reviews.length === 0) return 0;
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
}

export type RatingDistribution = Record<1 | 2 | 3 | 4 | 5, number>;

export function ratingDistribution(reviews: Pick<ReviewDoc, "rating">[]): RatingDistribution {
  const distribution: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    distribution[r.rating] += 1;
  }
  return distribution;
}

export function approvedOnly<T extends Pick<ReviewDoc, "status">>(reviews: T[]): T[] {
  return reviews.filter((r) => r.status === "approved");
}

export function pendingOnly<T extends Pick<ReviewDoc, "status">>(reviews: T[]): T[] {
  return reviews.filter((r) => r.status === "pending");
}
