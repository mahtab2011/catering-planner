"use client";

import { useTranslations } from "next-intl";
import type { RestaurantDataConfidence, RestaurantOwnerClaimStatus, RestaurantSourceType } from "@/lib/types";

type Props = {
  sourceType?: RestaurantSourceType;
  sourceName?: string;
  ownerClaimStatus?: RestaurantOwnerClaimStatus;
  dataConfidence?: RestaurantDataConfidence;
};

const SOURCE_TYPE_TRANSLATION_KEY: Record<RestaurantSourceType, string> = {
  restaurant_submitted: "originRestaurantSubmitted",
  owner_claimed: "originOwnerClaimed",
  open_data: "originOpenData",
  licensed_provider: "originLicensedProvider",
  official_public_source: "originOfficialPublicSource",
  editorial_research: "originEditorialResearch",
};

/**
 * Neutral provenance/affiliation disclosure — see
 * docs/RESTAURANT-DATA-PROVENANCE.md for the ground rules this copy
 * must follow (never implies affiliation/endorsement/certification or
 * a government/tourism-board relationship unless genuinely true for
 * that listing). The message catalog entries in the "ListingNotice"
 * namespace carry those same rules — see messages/en.json's comments
 * there for the canonical English wording any new locale should match.
 */
export default function PublicListingNotice({ sourceType, sourceName, ownerClaimStatus }: Props) {
  const t = useTranslations("ListingNotice");

  const origin = sourceType ? t(SOURCE_TYPE_TRANSLATION_KEY[sourceType]) : t("originDefault");
  const source = sourceName ? ` (${sourceName})` : "";
  const claimSuffix = ownerClaimStatus === "claimed" ? t("claimedSuffix") : t("unclaimedSuffix");

  return (
    <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs leading-relaxed text-neutral-500">
      {t("mainSentence", { origin, source })} {claimSuffix} {t("disclaimerBody")}
    </p>
  );
}
