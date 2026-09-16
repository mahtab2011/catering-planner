import type { ImportCandidate, ImportFieldError, ImportValidationResult } from "./types";
import { getAllCities } from "@/lib/cities";
import { getCuisineBySlug } from "@/lib/cuisines";

const VALID_SOURCE_TYPES = new Set([
  "restaurant_submitted",
  "owner_claimed",
  "open_data",
  "licensed_provider",
  "official_public_source",
  "editorial_research",
]);

// Loose UK postcode shape check — deliberately permissive (this is a
// data-quality signal for a human reviewer, not a hard gate that
// should reject a real postcode over minor formatting).
const UK_POSTCODE_PATTERN = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

/**
 * Validates one import candidate against the minimum bar a restaurant
 * record needs before it can even be considered for import — see
 * docs/RESTAURANT-IMPORT-PIPELINE.md. This never writes anything and
 * never fetches anything; it is a pure function over the candidate
 * plus the app's existing canonical city/cuisine registries.
 */
export function validateCandidate(candidate: ImportCandidate): ImportValidationResult {
  const errors: ImportFieldError[] = [];

  const name = (candidate.name || "").trim();
  if (!name) {
    errors.push({ field: "name", message: "Name is required." });
  }

  const citySlug = (candidate.citySlug || "").trim();
  if (!citySlug) {
    errors.push({ field: "citySlug", message: "citySlug is required." });
  } else if (!getAllCities().some((c) => c.slug === citySlug)) {
    errors.push({
      field: "citySlug",
      message: `citySlug "${citySlug}" is not in lib/cities.ts — add the city there first rather than importing data for a city edition that doesn't exist yet.`,
    });
  }

  const addressLine1 = (candidate.addressLine1 || "").trim();
  if (!addressLine1) {
    errors.push({ field: "addressLine1", message: "addressLine1 is required." });
  }

  const postcode = (candidate.postcode || "").trim();
  if (!postcode) {
    errors.push({ field: "postcode", message: "postcode is required." });
  } else if (!UK_POSTCODE_PATTERN.test(postcode)) {
    errors.push({
      field: "postcode",
      message: `"${postcode}" doesn't look like a UK postcode — check it by hand before importing.`,
    });
  }

  // Empty cuisineSlugs is NOT a validation error — it's a legitimate
  // "the source didn't say" outcome, routed to human review by
  // classifyCuisine()/runImportDryRun() rather than rejected here.
  // Never guess a cuisine to satisfy this check — see
  // docs/RESTAURANT-IMPORT-PIPELINE.md's "Unknown cuisine" section.
  // An explicitly-provided but unrecognised slug IS still an error —
  // that's a data-quality problem, not an "unknown" case.
  const cuisineSlugs = candidate.cuisineSlugs || [];
  for (const slug of cuisineSlugs) {
    if (!getCuisineBySlug(slug)) {
      errors.push({
        field: "cuisineSlugs",
        message: `"${slug}" is not a known cuisine slug in lib/cuisines.ts.`,
      });
    }
  }

  if (!candidate.sourceType) {
    errors.push({ field: "sourceType", message: "sourceType is required." });
  } else if (!VALID_SOURCE_TYPES.has(candidate.sourceType)) {
    errors.push({
      field: "sourceType",
      message: `"${candidate.sourceType}" is not a recognised RestaurantSourceType.`,
    });
  }

  if (!candidate.sourceName || !candidate.sourceName.trim()) {
    errors.push({ field: "sourceName", message: "sourceName is required — record where this data came from." });
  }

  // A source URL is required only for sources that are genuinely an
  // external page/dataset — self-submissions and the LFH team's own
  // editorial research have no such page to point to.
  const sourceTypesWithoutUrl = new Set(["restaurant_submitted", "owner_claimed", "editorial_research"]);
  if (
    candidate.sourceType &&
    !sourceTypesWithoutUrl.has(candidate.sourceType) &&
    (!candidate.sourceUrl || !candidate.sourceUrl.trim())
  ) {
    errors.push({
      field: "sourceUrl",
      message: `sourceUrl is required when sourceType is "${candidate.sourceType}".`,
    });
  }

  return {
    batchRowId: candidate.batchRowId,
    isValid: errors.length === 0,
    errors,
  };
}
