import type { AppLanguage } from "@/lib/i18n";

export const HERO_DATA: Record<
  AppLanguage,
  {
    title: string;
    subtitle: string;
    restaurantCTA: string;
    buttons: { label: string; href: string }[];
  }
> = {