// lib/voice/intent.ts
export type VoiceIntent =
  | { kind: "phone"; value: string; digits: string }
  | { kind: "name"; value: string };

function normalizeSpokenDigits(s: string) {
  // common speech → digits
  // e.g. "zero seven nine" -> "079"
  const map: Record<string, string> = {
    zero: "0",
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8",
    nine: "9",
  };

  // replace words with digits
  const words = s
    .toLowerCase()
    .replace(/plus/gi, "+")
    .replace(/double\s+zero/gi, "00")
    .split(/\s+/);

  let out = "";
  for (const w of words) {
    if (map[w]) out += map[w];
    else out += w;
  }
  return out;
}

export function detectPhoneOrName(raw: string): VoiceIntent {
  const cleaned = raw.trim();

  // Convert spoken digits
  const spoken = normalizeSpokenDigits(cleaned);

  // Keep digits and plus only
  const digits = spoken.replace(/[^\d+]/g, "");

  // Heuristics:
  // - If contains 7+ digits overall → phone
  // - Or starts with +44 / 0044 / 07 / 01 etc
  const digitCount = digits.replace(/[^\d]/g, "").length;

  const looksLikePhone =
    digitCount >= 7 ||
    /^\+?44/.test(digits) ||
    /^0044/.test(digits) ||
    /^0\d{6,}$/.test(digits);

  if (looksLikePhone) {
    // Keep original "value" for UI, but provide digits for query
    return { kind: "phone", value: cleaned, digits };
  }

  return { kind: "name", value: cleaned };
}