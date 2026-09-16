import type { ImportCandidate, DietaryDeclarationBasis } from "./types";
import type { DietaryAttribute } from "@/lib/types";

export type DietaryClaimValidationResult = {
  batchRowId: string;
  /** Only attributes that passed validation — an attribute with no
   *  declared basis, or a basis this pipeline doesn't consider
   *  strong enough for an import candidate, is dropped here rather
   *  than kept with a weaker guarantee than it appears to have. */
  acceptedAttributes: DietaryAttribute[];
  errors: string[];
};

/**
 * Validates dietary claims on an import candidate. The rule this
 * exists to enforce: a dietary attribute is NEVER inferred from
 * cuisine (an "Indian" cuisine slug does not imply vegetarian; a
 * "Middle Eastern" one does not imply halal) — it is accepted only
 * when the source explicitly provided both the attribute AND a
 * declared basis for it (see DietaryDeclarationBasis in
 * lib/import/types.ts). See docs/RESTAURANT-DATA-PROVENANCE.md's
 * "Dietary declaration basis" section.
 *
 * `"platform_verified"` is rejected here specifically — an import
 * pipeline reading a local source file has no way to have actually
 * verified anything itself; only a genuine downstream London Food
 * Hubs review process can earn that basis, and claiming it at import
 * time would be exactly the "self-declaration turned into platform
 * certification" this system must not do.
 */
export function validateDietaryClaims(candidate: ImportCandidate): DietaryClaimValidationResult {
  const errors: string[] = [];
  const attributes = candidate.dietaryAttributes || [];
  const basisMap = candidate.dietaryDeclarationBasis || {};

  const accepted: DietaryAttribute[] = [];

  for (const attr of attributes) {
    const basis: DietaryDeclarationBasis | undefined = basisMap[attr];

    if (!basis) {
      errors.push(`Dietary attribute "${attr}" has no declared basis — dropped, not assumed.`);
      continue;
    }

    if (basis === "platform_verified") {
      errors.push(
        `Dietary attribute "${attr}" was marked "platform_verified" at import time — an import pipeline cannot self-assign this basis. Dropped; a real London Food Hubs review step may upgrade it later.`
      );
      continue;
    }

    accepted.push(attr);
  }

  return { batchRowId: candidate.batchRowId, acceptedAttributes: [...new Set(accepted)], errors };
}
