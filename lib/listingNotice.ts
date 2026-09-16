/**
 * RETIRED — not imported anywhere. Superseded by next-intl's
 * "ListingNotice" message namespace (messages/{en,bn,ar,fr}.json) and
 * components/restaurants/PublicListingNotice.tsx, which composes the
 * live notice via useTranslations() rather than this file's
 * English-only functions. Left in place (not deleted) per this
 * repository's usual rollback-safety convention, and because its
 * ground-rules comment below still documents the real requirements
 * the translated copy must also satisfy. Do not add new imports of
 * this file — edit the message catalogs instead.
 *
 * Neutral, configurable public-listing notice shown on a restaurant's
 * detail page — see docs/RESTAURANT-DATA-PROVENANCE.md and
 * docs/RESTAURANT-CLAIM-WORKFLOW.md.
 *
 * Ground rules for the copy here (do not violate these when editing):
 *   - Never claims London Food Hubs is affiliated with, endorsed by,
 *     or certifies the business, unless that specific business has
 *     been through an actual verification process reflected in its
 *     `dataConfidence` field.
 *   - Never claims any government, council, tourism-board or other
 *     official affiliation.
 *   - Always distinguishes: (1) facts the business itself provided or
 *     confirmed, (2) facts from another named source, and (3) LFH's
 *     own editorial content (reviews are neither — they're the
 *     public's).
 *   - Kept short and plain — this is a trust disclosure, not
 *     marketing copy.
 */

import type { RestaurantDataConfidence, RestaurantOwnerClaimStatus, RestaurantSourceType } from "./types";

const SOURCE_TYPE_LABELS: Record<RestaurantSourceType, string> = {
  restaurant_submitted: "submitted by this business",
  owner_claimed: "submitted by this business",
  open_data: "compiled from a public open dataset",
  licensed_provider: "supplied by a licensed data provider",
  official_public_source: "compiled from an official public source",
  editorial_research: "compiled by the London Food Hubs editorial team",
};

export function getListingProvenanceNotice(params: {
  sourceType?: RestaurantSourceType;
  sourceName?: string;
  ownerClaimStatus?: RestaurantOwnerClaimStatus;
  dataConfidence?: RestaurantDataConfidence;
}): string {
  const { sourceType, sourceName, ownerClaimStatus } = params;

  const originPhrase = sourceType
    ? SOURCE_TYPE_LABELS[sourceType]
    : "provided to London Food Hubs";

  const sourceSuffix = sourceName ? ` (${sourceName})` : "";

  const claimSuffix =
    ownerClaimStatus === "claimed"
      ? " This business manages its own listing."
      : " This business has not yet claimed or verified this listing.";

  return (
    `This listing was ${originPhrase}${sourceSuffix}.${claimSuffix} ` +
    `London Food Hubs is not affiliated with, endorsed by, or a certifying body for this business, ` +
    `and this listing does not imply any government, council or tourism-board affiliation. ` +
    `Customer reviews below reflect individual reviewers' own opinions, not London Food Hubs'.`
  );
}

/** Shorter variant for a compact badge/tooltip rather than the full
 *  paragraph — used on cards and in tighter layouts. */
export function getListingProvenanceShortLabel(dataConfidence?: RestaurantDataConfidence): string {
  switch (dataConfidence) {
    case "verified":
      return "Details reviewed by London Food Hubs";
    case "flagged":
      return "Details under review";
    case "unverified":
    default:
      return "Details not yet independently verified";
  }
}
