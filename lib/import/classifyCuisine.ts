import type { ImportCandidate, CuisineClassificationStatus } from "./types";
import { getCuisineBySlug } from "@/lib/cuisines";

export type CuisineClassificationResult = {
  batchRowId: string;
  cuisineSlugs: string[];
  status: CuisineClassificationStatus;
  errors: string[];
};

/**
 * Classifies a candidate's cuisine — or, more precisely, confirms
 * whether it was ALREADY classified by the source data, since this
 * function never guesses.
 *
 * This is the one rule this whole module exists to enforce: cuisine
 * is NEVER inferred from a restaurant's name, an owner's apparent
 * nationality, the neighbourhood/postcode, or review text. If
 * `candidate.cuisineSlugs` wasn't explicitly present in the source
 * data, the result is `"unknown_requires_review"` and `cuisineSlugs`
 * comes back empty — never populated with a best guess. A human
 * operator resolves these later, with actual judgement and
 * accountability, not a heuristic standing in for one. See
 * docs/RESTAURANT-IMPORT-PIPELINE.md's "Unknown cuisine" section.
 *
 * The only real "classification" work this function does is
 * validating that every slug the source DID provide is a real,
 * known cuisine in lib/cuisines.ts — an unrecognised slug is dropped
 * with an error rather than silently kept, since an invalid slug is
 * as unusable downstream as no slug at all.
 */
export function classifyCuisine(candidate: ImportCandidate): CuisineClassificationResult {
  const errors: string[] = [];
  const provided = candidate.cuisineSlugs || [];

  if (provided.length === 0) {
    return {
      batchRowId: candidate.batchRowId,
      cuisineSlugs: [],
      status: "unknown_requires_review",
      errors: [],
    };
  }

  const validSlugs: string[] = [];
  for (const slug of provided) {
    if (getCuisineBySlug(slug)) {
      validSlugs.push(slug);
    } else {
      errors.push(`"${slug}" is not a known cuisine slug in lib/cuisines.ts — dropped, not guessed at.`);
    }
  }

  if (validSlugs.length === 0) {
    return {
      batchRowId: candidate.batchRowId,
      cuisineSlugs: [],
      status: "unknown_requires_review",
      errors,
    };
  }

  return {
    batchRowId: candidate.batchRowId,
    cuisineSlugs: validSlugs,
    status: "classified",
    errors,
  };
}
