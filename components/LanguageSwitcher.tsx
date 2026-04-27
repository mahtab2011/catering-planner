"use client";

import type { AppLanguage } from "@/lib/i18n";

type LanguageSwitcherProps = {
  lang: AppLanguage;
  onChangeLang: (next: AppLanguage) => void;
};

const LANGUAGE_OPTIONS: {
  value: AppLanguage;
  label: string;
  fullLabel: string;
  flag: string;
}[] = [
  { value: "en", label: "EN", fullLabel: "English", flag: "🇬🇧" },
  { value: "bn", label: "BN", fullLabel: "বাংলা", flag: "🇧🇩" },
  { value: "it", label: "IT", fullLabel: "Italiano", flag: "🇮🇹" },
  { value: "fr", label: "FR", fullLabel: "Français", flag: "🇫🇷" },
  { value: "de", label: "DE", fullLabel: "Deutsch", flag: "🇩🇪" },
  { value: "es", label: "ES", fullLabel: "Español", flag: "🇪🇸" },
  { value: "ar", label: "AR", fullLabel: "العربية", flag: "🇸🇦" },
  { value: "zh", label: "ZH", fullLabel: "中文", flag: "🇨🇳" },
  { value: "ja", label: "JA", fullLabel: "日本語", flag: "🇯🇵" },
  { value: "th", label: "TH", fullLabel: "ไทย", flag: "🇹🇭" },
];

export default function LanguageSwitcher({
  lang,
  onChangeLang,
}: LanguageSwitcherProps) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-max items-center gap-2 rounded-2xl border border-sky-100 bg-white/95 p-2 shadow-sm">
        {LANGUAGE_OPTIONS.map((option) => {
          const active = option.value === lang;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChangeLang(option.value)}
              title={option.fullLabel}
              aria-label={option.fullLabel}
              aria-pressed={active}
              className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition ${
                active
                  ? "border-sky-600 bg-sky-600 text-white shadow-sm"
                  : "border-sky-100 bg-white text-sky-700 hover:border-sky-300 hover:bg-sky-50"
              }`}
            >
              <span className="text-base leading-none">{option.flag}</span>
              <span className="leading-none">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}