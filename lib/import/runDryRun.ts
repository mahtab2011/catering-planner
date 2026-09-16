import type {
  ExistingRestaurantForDedupe,
  ImportCandidate,
  ImportDryRunReportRow,
} from "./types";
import { validateCandidate } from "./validateCandidate";
import { classifyDuplicate } from "./duplicateDetection";
import { classifyCuisine } from "./classifyCuisine";
import { validateDietaryClaims } from "./validateDietaryClaims";

/**
 * Runs validation + cuisine classification + dietary-claim validation
 * + duplicate detection over a batch of import candidates and
 * produces a report — never writes anything anywhere. See
 * docs/RESTAURANT-IMPORT-PIPELINE.md and
 * functions/scripts/importRestaurantsDryRun.js (the CLI entry point
 * that loads local JSON files and calls this).
 */
export function runImportDryRun(
  candidates: ImportCandidate[],
  existing: ExistingRestaurantForDedupe[]
): ImportDryRunReportRow[] {
  return candidates.map((candidate) => {
    const validation = validateCandidate(candidate);
    const duplicateCheck = classifyDuplicate(candidate, existing);
    const cuisineResult = classifyCuisine(candidate);
    const dietaryResult = validateDietaryClaims(candidate);

    let recommendedAction: ImportDryRunReportRow["recommendedAction"];
    if (!validation.isValid) {
      recommendedAction = "skip";
    } else if (duplicateCheck.classification === "match") {
      recommendedAction = "skip";
    } else if (
      duplicateCheck.classification === "possible_match" ||
      duplicateCheck.classification === "requires_review"
    ) {
      recommendedAction = "human_review";
    } else if (cuisineResult.status === "unknown_requires_review") {
      // Never auto-imported with a guessed cuisine — see
      // classifyCuisine()'s own doc comment.
      recommendedAction = "human_review";
    } else {
      recommendedAction = "would_create";
    }

    return {
      batchRowId: candidate.batchRowId,
      candidateName: candidate.name || "(no name)",
      validation,
      duplicateCheck,
      cuisineClassificationStatus: cuisineResult.status,
      cuisineErrors: cuisineResult.errors,
      acceptedDietaryAttributes: dietaryResult.acceptedAttributes,
      dietaryErrors: dietaryResult.errors,
      recommendedAction,
    };
  });
}

export function summarizeDryRun(rows: ImportDryRunReportRow[]) {
  return {
    total: rows.length,
    wouldCreate: rows.filter((r) => r.recommendedAction === "would_create").length,
    skip: rows.filter((r) => r.recommendedAction === "skip").length,
    humanReview: rows.filter((r) => r.recommendedAction === "human_review").length,
  };
}
