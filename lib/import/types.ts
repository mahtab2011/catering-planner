/**
 * Types for the restaurant import-pipeline foundation.
 *
 * This module is intentionally pure data/logic with no Firestore, no
 * network, and no filesystem imports — see
 * docs/RESTAURANT-IMPORT-PIPELINE.md for the full design and why this
 * pipeline is dry-run-only until a human explicitly wires a real
 * source and a real write step, neither of which exists yet.
 */

import type { DietaryAttribute } from "@/lib/types";
import type { RestaurantSourceType } from "@/lib/types";

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
  cuisineSlugs?: string[];
  dietaryAttributes?: DietaryAttribute[];
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
  /** What a real import run would do with this row, GIVEN the dry-run
   *  findings — computed, never executed. "skip" happens for invalid
   *  rows or "match" duplicates; "human_review" for "possible_match"
   *  or "requires_review"; "would_create" only for valid + "new". */
  recommendedAction: "would_create" | "skip" | "human_review";
};
