import type {
  DuplicateCheckResult,
  DuplicateMatchClassification,
  DuplicateMatchSignal,
  ExistingRestaurantForDedupe,
  ImportCandidate,
} from "./types";

/** Lowercases, strips punctuation and collapses whitespace so "The
 *  Spice House" and "Spice House Ltd." are recognisably closer than a
 *  raw string comparison would find them, without doing anything
 *  fuzzy/probabilistic that would be hard to explain to a human
 *  reviewer. */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(the|ltd|limited|restaurant|takeaway|cafe|café)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizePostcode(postcode: string): string {
  return postcode.toUpperCase().replace(/\s+/g, "");
}

function normalizeAddress(address: string): string {
  return address.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

function domainOf(url: string): string | null {
  try {
    const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return new URL(withProtocol).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Classifies one import candidate against a locally-supplied set of
 * existing restaurants (see ExistingRestaurantForDedupe — never a
 * live Firestore query; the caller is responsible for sourcing that
 * set, e.g. from a manual export). See
 * docs/RESTAURANT-IMPORT-PIPELINE.md for the full classification
 * rules this implements and why each threshold was chosen.
 *
 * Deliberately conservative: this function has exactly one job — to
 * never let a genuine duplicate through as "new" — so any ambiguity
 * resolves toward "possible_match"/"requires_review" rather than
 * guessing. A false "possible_match" costs a human two minutes; a
 * false "new" creates a duplicate listing that confuses customers and
 * undermines the directory's usefulness.
 */
export function classifyDuplicate(
  candidate: ImportCandidate,
  existing: ExistingRestaurantForDedupe[]
): DuplicateCheckResult {
  const name = (candidate.name || "").trim();
  const postcode = (candidate.postcode || "").trim();
  const phone = (candidate.phone || "").trim();
  const website = (candidate.website || "").trim();
  const address = (candidate.addressLine1 || "").trim();

  // If the candidate itself doesn't carry enough identifying data to
  // compare against anything, don't guess "new" — flag it for a human
  // instead. Name alone is not enough (too many name collisions
  // across an entire city), so at least one of postcode/phone/website
  // must also be present.
  const hasIdentifyingSignal = Boolean(postcode || phone || website);
  if (!name || !hasIdentifyingSignal) {
    return {
      batchRowId: candidate.batchRowId,
      classification: "requires_review",
      signals: [],
    };
  }

  const normalizedCandidateName = normalizeName(name);
  const normalizedCandidatePostcode = postcode ? normalizePostcode(postcode) : null;
  const normalizedCandidateAddress = address ? normalizeAddress(address) : null;
  const normalizedCandidatePhone = phone ? normalizePhone(phone) : null;
  const candidateDomain = website ? domainOf(website) : null;

  const signals: DuplicateMatchSignal[] = [];

  for (const record of existing) {
    const recordNameNorm = normalizeName(record.name);
    const nameMatches = normalizedCandidateName.length > 0 && normalizedCandidateName === recordNameNorm;

    const recordPostcodeNorm = record.postcode ? normalizePostcode(record.postcode) : null;
    const postcodeMatches =
      normalizedCandidatePostcode !== null &&
      recordPostcodeNorm !== null &&
      normalizedCandidatePostcode === recordPostcodeNorm;

    const recordAddressNorm = record.addressLine1 ? normalizeAddress(record.addressLine1) : null;
    const addressMatches =
      normalizedCandidateAddress !== null &&
      recordAddressNorm !== null &&
      normalizedCandidateAddress === recordAddressNorm;

    const recordPhoneNorm = record.phone ? normalizePhone(record.phone) : null;
    const phoneMatches =
      normalizedCandidatePhone !== null &&
      recordPhoneNorm !== null &&
      normalizedCandidatePhone.length >= 8 &&
      normalizedCandidatePhone === recordPhoneNorm;

    const recordDomain = record.website ? domainOf(record.website) : null;
    const websiteDomainMatches =
      candidateDomain !== null && recordDomain !== null && candidateDomain === recordDomain;

    if (nameMatches) signals.push({ signal: "normalized_name", matchedExistingId: record.id });
    if (postcodeMatches) signals.push({ signal: "postcode", matchedExistingId: record.id });
    if (addressMatches) signals.push({ signal: "address", matchedExistingId: record.id });
    if (phoneMatches) signals.push({ signal: "phone", matchedExistingId: record.id });
    if (websiteDomainMatches) signals.push({ signal: "website_domain", matchedExistingId: record.id });
  }

  const classification = classifyFromSignals(signals);

  return { batchRowId: candidate.batchRowId, classification, signals };
}

function classifyFromSignals(signals: DuplicateMatchSignal[]): DuplicateMatchClassification {
  if (signals.length === 0) return "new";

  // Group by which existing record each signal points at — a
  // "match" requires two or more independent signals agreeing on the
  // SAME existing record (e.g. name + postcode, or phone + website
  // domain), not just one weak signal on its own.
  const byExistingId = new Map<string, Set<DuplicateMatchSignal["signal"]>>();
  for (const s of signals) {
    if (!byExistingId.has(s.matchedExistingId)) byExistingId.set(s.matchedExistingId, new Set());
    byExistingId.get(s.matchedExistingId)!.add(s.signal);
  }

  for (const signalSet of byExistingId.values()) {
    // An exact phone or website-domain match alone is already
    // strong enough on its own — those aren't the kind of field that
    // coincidentally matches between two unrelated businesses.
    if (signalSet.has("phone") || signalSet.has("website_domain")) return "match";
    // Name + postcode, or name + address, is strong enough together.
    if (signalSet.has("normalized_name") && (signalSet.has("postcode") || signalSet.has("address"))) {
      return "match";
    }
  }

  // Some signal fired, but not a strong enough combination — always a
  // human decision, never auto-resolved either way.
  return "possible_match";
}
