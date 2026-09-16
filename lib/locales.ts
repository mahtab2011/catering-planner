/**
 * Canonical locale registry for London Food Hubs.
 *
 * This is the single source of truth for which languages the
 * platform can eventually support (`LocaleCode`, ~26 candidates) and
 * which are actually live today (`ACTIVE_LOCALES`, 4). Adding a
 * language later means adding one entry here and one message file —
 * see docs/MULTILINGUAL-ARCHITECTURE.md's "How to add a new
 * language" section for the exact procedure.
 *
 * Distinguishing ACTIVE from PLANNED matters: `LocaleCode` is used
 * wherever a locale-shaped value might exist in data (e.g.
 * `City.priorityLanguages`, translated-content maps), but routing,
 * the language selector, and next-intl's own config only ever expose
 * `ACTIVE_LOCALES`. A value in the registry with status "planned" is
 * type-safe to reference (e.g. a future city can already declare
 * priorityLanguages: ["hi"]) without being live anywhere.
 *
 * This candidate list is roadmap context, not a claim that these are
 * population-ranked or final — see the task that produced this file.
 */

export type LocaleCode =
  | "en"
  | "bn"
  | "ur"
  | "pa"
  | "hi"
  | "ar"
  | "zh"
  | "tr"
  | "pl"
  | "ro"
  | "pt"
  | "es"
  | "fr"
  | "it"
  | "de"
  | "nl"
  | "so"
  | "fa"
  | "ta"
  | "gu"
  | "ja"
  | "ko"
  | "ms"
  | "th"
  | "ru"
  | "uk";

export type LocaleStatus = "active" | "planned";

export type LocaleDefinition = {
  code: LocaleCode;
  /** Name in the language itself, for the language selector. */
  nativeName: string;
  /** English name, for admin UIs and this registry's own readability. */
  englishName: string;
  rtl: boolean;
  status: LocaleStatus;
};

export const LOCALE_REGISTRY: Record<LocaleCode, LocaleDefinition> = {
  en: { code: "en", nativeName: "English", englishName: "English", rtl: false, status: "active" },
  bn: { code: "bn", nativeName: "বাংলা", englishName: "Bengali", rtl: false, status: "active" },
  ar: { code: "ar", nativeName: "العربية", englishName: "Arabic", rtl: true, status: "active" },
  fr: { code: "fr", nativeName: "Français", englishName: "French", rtl: false, status: "active" },

  // Planned — registered so data (e.g. City.priorityLanguages, future
  // translated content) can reference them type-safely, but not
  // routable, not in the language selector, and not translated yet.
  ur: { code: "ur", nativeName: "اردو", englishName: "Urdu", rtl: true, status: "planned" },
  pa: { code: "pa", nativeName: "ਪੰਜਾਬੀ", englishName: "Punjabi", rtl: false, status: "planned" },
  hi: { code: "hi", nativeName: "हिन्दी", englishName: "Hindi", rtl: false, status: "planned" },
  zh: { code: "zh", nativeName: "中文", englishName: "Chinese", rtl: false, status: "planned" },
  tr: { code: "tr", nativeName: "Türkçe", englishName: "Turkish", rtl: false, status: "planned" },
  pl: { code: "pl", nativeName: "Polski", englishName: "Polish", rtl: false, status: "planned" },
  ro: { code: "ro", nativeName: "Română", englishName: "Romanian", rtl: false, status: "planned" },
  pt: { code: "pt", nativeName: "Português", englishName: "Portuguese", rtl: false, status: "planned" },
  es: { code: "es", nativeName: "Español", englishName: "Spanish", rtl: false, status: "planned" },
  it: { code: "it", nativeName: "Italiano", englishName: "Italian", rtl: false, status: "planned" },
  de: { code: "de", nativeName: "Deutsch", englishName: "German", rtl: false, status: "planned" },
  nl: { code: "nl", nativeName: "Nederlands", englishName: "Dutch", rtl: false, status: "planned" },
  so: { code: "so", nativeName: "Soomaali", englishName: "Somali", rtl: false, status: "planned" },
  fa: { code: "fa", nativeName: "فارسی", englishName: "Persian / Farsi", rtl: true, status: "planned" },
  ta: { code: "ta", nativeName: "தமிழ்", englishName: "Tamil", rtl: false, status: "planned" },
  gu: { code: "gu", nativeName: "ગુજરાતી", englishName: "Gujarati", rtl: false, status: "planned" },
  ja: { code: "ja", nativeName: "日本語", englishName: "Japanese", rtl: false, status: "planned" },
  ko: { code: "ko", nativeName: "한국어", englishName: "Korean", rtl: false, status: "planned" },
  ms: { code: "ms", nativeName: "Bahasa Melayu", englishName: "Malay / Indonesian", rtl: false, status: "planned" },
  th: { code: "th", nativeName: "ไทย", englishName: "Thai", rtl: false, status: "planned" },
  ru: { code: "ru", nativeName: "Русский", englishName: "Russian", rtl: false, status: "planned" },
  uk: { code: "uk", nativeName: "Українська", englishName: "Ukrainian", rtl: false, status: "planned" },
};

export const ALL_LOCALE_CODES = Object.keys(LOCALE_REGISTRY) as LocaleCode[];

/** Locales that are routable, selectable, and have a real message
 *  file today. This is the array next-intl's routing config and the
 *  language selector both read — the ONLY place that list is
 *  hand-maintained. */
export const ACTIVE_LOCALES: LocaleCode[] = ["en", "bn", "ar", "fr"];

export const DEFAULT_LOCALE: LocaleCode = "en";

export const RTL_LOCALES: LocaleCode[] = ALL_LOCALE_CODES.filter(
  (code) => LOCALE_REGISTRY[code].rtl
);

export function isActiveLocale(value: string): value is LocaleCode {
  return (ACTIVE_LOCALES as string[]).includes(value);
}

export function isRTLLocale(value: string): boolean {
  return (RTL_LOCALES as string[]).includes(value);
}

export function getLocaleDefinition(code: LocaleCode): LocaleDefinition {
  return LOCALE_REGISTRY[code];
}

export function getActiveLocaleDefinitions(): LocaleDefinition[] {
  return ACTIVE_LOCALES.map((code) => LOCALE_REGISTRY[code]);
}

export function getPlannedLocaleDefinitions(): LocaleDefinition[] {
  return ALL_LOCALE_CODES.filter((code) => LOCALE_REGISTRY[code].status === "planned").map(
    (code) => LOCALE_REGISTRY[code]
  );
}
