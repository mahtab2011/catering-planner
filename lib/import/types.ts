/**
 * Types for the restaurant import-pipeline foundation.
 *
 * This module is intentionally pure data/logic with no Firestore, no
 * network, and no filesystem imports — see
 * docs/RESTAURANT-IMPORT-PIPELINE.md for the full design and why this
 * pipeline is dry-run-only until a human explicitly wires a real
 * source and a real write step, neither of which exists yet.
 */

import type { DietaryAttribute, RestaurantDataConfidence } from "@/lib/types";
import type { RestaurantSourceType } from "@/lib/types";

/** Where a dietary claim on an import candidate actually came from —
 *  never conflated with each other, and never inferred from cuisine.
 *  See docs/RESTAURANT-DATA-PROVENANCE.md's "Dietary declaration
 *  basis" section.
 *
 *   - "restaurant_declared": the business itself told the source this
 *     (e.g. filled in a field on a submission form the source used).
 *   - "source_reported": the source dataset/provider asserts this as
 *     a fact about the business, without it being a first-party
 *     restaurant declaration (e.g. a licensing/inspection dataset
 *     that happens to record it).
 *   - "platform_verified": London Food Hubs itself (an admin, or a
 *     documented verification step) confirmed this — the highest
 *     trust level, and one this import pipeline itself can never
 *     assign; only a human review step downstream can. */
export type DietaryDeclarationBasis = "restaurant_declared" | "source_reported" | "platform_verified";

/** Whether a candidate's cuisine could be determined from the source
 *  data itself. "classified" means `cuisineSlugs` was explicitly
 *  present in the source (never inferred from the restaurant's name,
 *  the owner's apparent nationality, the neighbourhood, or review
 *  text — see classifyCuisine() in lib/import/classifyCuisine.ts and
 *  docs/RESTAURANT-IMPORT-PIPELINE.md's "Unknown cuisine" section).
 *  "unknown_requires_review" means the source didn't provide enough
 *  to classify, and a human operator must do so later — this
 *  candidate is never auto-imported with a guessed cuisine. */
export type CuisineClassificationStatus = "classified" | "unknown_requires_review";

/** One row of candidate restaurant data from an import source, before
 *  it has been validated or checked for duplicates. Deliberately
 *  loose/optional on most fields — validateCandidate() is what turns
 *  this into a pass/fail judgement, not the type system. */
export type ImportCandidate = {
  /** Caller-assigned id for this candidate row within a single import
   *  batch (e.g. its line number or source-record id) — used only to
   *  refer back to it in a report, never written to Firestore. */
  batchRowId: string;
  name?: string;
  citySlug?: string;
  addressLine1?: string;
  postcode?: string;
  phone?: string;
  website?: string;
  /** Present only when the source explicitly provided cuisine
   *  information — see CuisineClassificationStatus. Never populated
   *  by guessing. */
  cuisineSlugs?: string[];
  /** Computed by classifyCuisine() from whether `cuisineSlugs` was
   *  explicitly provided — not set directly by the source file. */
  cuisineClassificationStatus?: CuisineClassificationStatus;
  dietaryAttributes?: DietaryAttribute[];
  /** Required for every entry in `dietaryAttributes` — see
   *  validateDietaryClaims() in lib/import/validateDietaryClaims.ts.
   *  A dietary attribute with no declared basis is rejected by
   *  validation, not silently imported. */
  dietaryDeclarationBasis?: Partial<Record<DietaryAttribute, DietaryDeclarationBasis>>;
  sourceType?: RestaurantSourceType;
  sourceName?: string;
  sourceUrl?: string;
  sourceRetrievedAt?: string;
  /** Raw notes carried through for a human reviewer — e.g. what page
   *  this came from, or why a field is missing. Never treated as
   *  restaurant description copy. */
  notes?: string;
};

export type ImportFieldError = {
  field: keyof ImportCandidate | "general";
  message: string;
};

export type ImportValidationResult = {
  batchRowId: string;
  isValid: boolean;
  errors: ImportFieldError[];
};

/**
 * Duplicate-detection classification for one candidate against the
 * existing-restaurant set it was checked against:
 *
 *  - "match": high-confidence the candidate is the same real-world
 *    business as an existing record (e.g. exact postcode + normalized
 *    name match, or exact phone/website match). Should never be
 *    imported as a new record — see the pipeline doc for what to do
 *    instead (skip, or route to a human as an update suggestion).
 *  - "possible_match": some signals align but not enough to be
 *    confident (e.g. name matches but postcode doesn't, or vice
 *    versa). Always routed to a human, never auto-imported and never
 *    auto-skipped.
 *  - "new": no meaningful overlap with any existing record on any
 *    signal. Safe to treat as a genuinely new candidate, subject to
 *    validateCandidate() still passing.
 *  - "requires_review": the candidate itself is missing enough data
 *    (e.g. no postcode AND no phone AND no website) that duplicate
 *    detection can't be run with any confidence either way. Always
 *    routed to a human — never defaults to "new".
 */
export type DuplicateMatchClassification =
  | "match"
  | "possible_match"
  | "new"
  | "requires_review";

export type DuplicateMatchSignal = {
  signal: "normalized_name" | "postcode" | "address" | "phone" | "website_domain";
  matchedExistingId: string;
};

export type DuplicateCheckResult = {
  batchRowId: string;
  classification: DuplicateMatchClassification;
  signals: DuplicateMatchSignal[];
};

/** Minimal shape of an "existing restaurant" record the duplicate
 *  checker compares candidates against. Deliberately NOT the full
 *  RestaurantDoc — this is meant to be populated from a local,
 *  human-provided export file (see docs/RESTAURANT-IMPORT-PIPELINE.md),
 *  never a live Firestore read, so it only needs the fields duplicate
 *  detection actually uses. */
export type ExistingRestaurantForDedupe = {
  id: string;
  name: string;
  postcode?: string;
  addressLine1?: string;
  phone?: string;
  website?: string;
};

export type ImportDryRunReportRow = {
  batchRowId: string;
  candidateName: string;
  validation: ImportValidationResult;
  duplicateCheck: DuplicateCheckResult;
  cuisineClassificationStatus: CuisineClassificationStatus;
  cuisineErrors: string[];
  acceptedDietaryAttributes: DietaryAttribute[];
  dietaryErrors: string[];
  /** What a real import run would do with this row, GIVEN the dry-run
   *  findings — computed, never executed. "skip" happens for invalid
   *  rows or "match" duplicates; "human_review" for "possible_match",
   *  "requires_review", or an unclassified cuisine (never auto-guessed
   *  — see classifyCuisine()); "would_create" only for valid + "new"
   *  + a classified cuisine. */
  recommendedAction: "would_create" | "skip" | "human_review";
};

/**
 * Status of one document in the `restaurant_import_candidates`
 * staging collection — see docs/RESTAURANT-IMPORT-PIPELINE.md's
 * "Staging collection" section. A candidate moves through this
 * lifecycle under human review; nothing in this codebase transitions
 * a candidate automatically except the dry-run classification that
 * sets the initial status.
 *
 *   PENDING_REVIEW    — staged, awaiting a human operator's decision.
 *   APPROVED          — a human operator confirmed this should become
 *                        a public restaurant. Only APPROVED candidates
 *                        may be picked up by the apply step.
 *   REJECTED          — a human operator decided this should not be
 *                        imported (e.g. not a real business, out of
 *                        scope, unreliable source).
 *   DUPLICATE         — a human operator (or the automatic "match"
 *                        classification) determined this is the same
 *                        business as an existing restaurant.
 *   NEEDS_RESEARCH     — insufficient/ambiguous data; parked for
 *                        follow-up research rather than approved or
 *                        rejected outright.
 *   IMPORTED          — the apply step has created the corresponding
 *                        public restaurant document. Terminal state;
 *                        `importedRestaurantId` records which one.
 */
export type RestaurantImportCandidateStatus =
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "DUPLICATE"
  | "NEEDS_RESEARCH"
  | "IMPORTED";

/**
 * The Firestore document shape for one row in the
 * `restaurant_import_candidates` staging collection — distinct from
 * `ImportCandidate` (the raw, pre-staging parsed row) because this is
 * what a human reviewer actually sees and acts on, and carries the
 * full audit trail of how it got there and what was decided.
 *
 * Never publicly readable — see firestore.rules' restaurant_import_
 * candidates block (admin-only, not deployed). Never directly
 * produces a public restaurant document by itself; only the apply
 * step, acting on an APPROVED candidate, does that — and even then
 * only when explicitly run with the right confirmation flags (see
 * functions/scripts/applyApprovedImportBatch.js).
 */
export type RestaurantImportCandidateDoc = {
  id: string;
  /** Groups every candidate staged from the same import run — lets a
   *  reviewer/operator work through, or roll back understanding of,
   *  one batch at a time. */
  batchId: string;
  status: RestaurantImportCandidateStatus;

  // ---- Candidate data (same shape as ImportCandidate, without
  // batchRowId — batchId + this document's own id serve that role) ----
  name?: string;
  citySlug?: string;
  addressLine1?: string;
  postcode?: string;
  phone?: string;
  website?: string;
  cuisineSlugs?: string[];
  cuisineClassificationStatus?: CuisineClassificationStatus;
  dietaryAttributes?: DietaryAttribute[];
  dietaryDeclarationBasis?: Partial<Record<DietaryAttribute, DietaryDeclarationBasis>>;

  // ---- Provenance — same fields as RestaurantDoc's provenance
  // model (docs/RESTAURANT-DATA-PROVENANCE.md), carried through
  // unchanged into the eventual public restaurant document ----
  sourceType?: RestaurantSourceType;
  sourceName?: string;
  sourceUrl?: string;
  sourceRetrievedAt?: unknown;
  lastVerifiedAt?: unknown;
  dataConfidence?: RestaurantDataConfidence;

  // ---- Duplicate-detection result, computed at staging time ----
  duplicateClassification?: DuplicateMatchClassification;
  duplicateSignals?: DuplicateMatchSignal[];

  // ---- Human review audit trail ----
  reviewedByUid?: string;
  reviewedAt?: unknown;
  reviewNote?: string;

  // ---- Set only once the apply step actually creates the public
  // restaurant document (status becomes IMPORTED at the same time) ----
  importedRestaurantId?: string;
  importedAt?: unknown;

  createdAt?: unknown;
  updatedAt?: unknown;
};

/**
 * A human-approved list of candidate ids ready for the apply step to
 * act on — the "approved batch" the pipeline diagram in
 * docs/RESTAURANT-IMPORT-PIPELINE.md refers to. This is a plain local
 * file (JSON), never Firestore — see
 * functions/scripts/applyApprovedImportBatch.js for how it's used.
 * Its existence as a separate, explicit artifact (rather than the
 * apply step just querying `status == 'APPROVED'` itself) is
 * deliberate: it forces a human to produce a concrete, reviewable
 * list of exactly what's about to be written, rather than the apply
 * step silently picking up anything that happens to match a status
 * filter at run time (which could include candidates approved after
 * the review session the operator thought they were acting on).
 */
export type ApprovedImportBatch = {
  batchId: string;
  approvedAt: string;
  approvedByUid: string;
  candidateIds: string[];
};
