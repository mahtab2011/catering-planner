import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Fast, visible discovery entry points for a visitor who doesn't yet
 * know the site — "what am I in the mood for" rather than a full
 * search. Every link here goes somewhere that actually works today.
 *
 * Deliberately does NOT include "Food Near Me" / "Food Near My
 * Hotel" or similar location-based entry points — no geolocation
 * feature exists in this codebase, and advertising one would be
 * misleading. See docs/MULTILINGUAL-ARCHITECTURE.md's tourist
 * positioning note.
 */
export default function TouristDiscoverySection() {
  const t = useTranslations("TouristDiscovery");

  const links = [
    { label: t("britishFood"), href: "/cuisine/british-food-london" },
    { label: t("worldCuisines"), href: "/cuisines" },
    { label: t("halalFood"), href: "/restaurants?dietary=halal" },
    { label: t("vegetarianFood"), href: "/restaurants?dietary=vegetarian" },
    { label: t("veganFood"), href: "/restaurants?dietary=vegan" },
    { label: t("londonFoodHubs"), href: "/hubs" },
    { label: t("londonFoodGuides"), href: "/blog" },
  ];

  return (
    <section>
      <h2 className="text-2xl font-bold text-neutral-900">{t("title")}</h2>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">{t("subtitle")}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
