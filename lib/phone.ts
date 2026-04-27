export function normalizeUkPhone(input: string) {
  if (!input) return "";

  // remove spaces, dashes, brackets, +
  let cleaned = input.replace(/\D/g, "");

  // convert 0044 to 44
  if (cleaned.startsWith("0044")) {
    cleaned = cleaned.slice(2);
  }

  // convert leading 0 to 44
  if (cleaned.startsWith("0")) {
    cleaned = "44" + cleaned.slice(1);
  }

  return cleaned;
}