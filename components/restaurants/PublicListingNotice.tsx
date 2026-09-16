import { getListingProvenanceNotice } from "@/lib/listingNotice";
import type { RestaurantDataConfidence, RestaurantOwnerClaimStatus, RestaurantSourceType } from "@/lib/types";

type Props = {
  sourceType?: RestaurantSourceType;
  sourceName?: string;
  ownerClaimStatus?: RestaurantOwnerClaimStatus;
  dataConfidence?: RestaurantDataConfidence;
};

/** Neutral provenance/affiliation disclosure — see
 *  lib/listingNotice.ts for the ground rules this copy must follow. */
export default function PublicListingNotice(props: Props) {
  const notice = getListingProvenanceNotice(props);
  return (
    <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs leading-relaxed text-neutral-500">
      {notice}
    </p>
  );
}
