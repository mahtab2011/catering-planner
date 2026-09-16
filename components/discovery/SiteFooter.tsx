import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string; operational?: boolean }[];
}) {
  return (
    <div>
      <div className="text-sm font-semibold text-white">{title}</div>
      <ul className="mt-3 space-y-2">
        {links.map((link) =>
          link.operational ? (
            <li key={link.href + link.label}>
              <NextLink href={link.href} className="text-sm text-neutral-400 hover:text-white">
                {link.label}
              </NextLink>
            </li>
          ) : (
            <li key={link.href + link.label}>
              <Link href={link.href} className="text-sm text-neutral-400 hover:text-white">
                {link.label}
              </Link>
            </li>
          )
        )}
      </ul>
    </div>
  );
}

export default function SiteFooter() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();

  const discoverLinks = [
    { label: t("restaurants"), href: "/restaurants" },
    { label: t("cuisines"), href: "/cuisines" },
    { label: t("foodHubs"), href: "/hubs" },
    { label: t("search"), href: "/search" },
  ];

  const editorialLinks = [
    { label: t("blog"), href: "/blog" },
    { label: t("recommendations"), href: "/recommendations" },
    { label: t("reviews"), href: "/reviews" },
  ];

  // Business/account/legal links all point to SmartServeUK operational
  // routes outside the app/[locale] subtree — plain next/link, never
  // the locale-aware Link.
  const businessLinks = [
    { label: t("listYourBusiness"), href: "/signup/restaurant", operational: true },
    { label: t("restaurantOnboardingGuide"), href: "/restaurant-onboarding-guide", operational: true },
    { label: t("businessLogin"), href: "/login", operational: true },
  ];

  const accountLinks = [
    { label: t("createAccount"), href: "/create-account", operational: true },
    { label: t("logIn"), href: "/login", operational: true },
  ];

  const legalLinks = [
    { label: t("privacyPolicy"), href: "/privacy-policy" },
    { label: t("terms"), href: "/terms" },
    { label: t("cookiePolicy"), href: "/cookie-policy" },
  ];

  return (
    <footer className="bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <FooterColumn title={t("discover")} links={discoverLinks} />
          <FooterColumn title={t("editorial")} links={editorialLinks} />
          <FooterColumn title={t("forBusinesses")} links={businessLinks} />
          <FooterColumn title={t("account")} links={accountLinks} />
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-neutral-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-500">
            {t("copyright", { year })}
          </p>
          <div className="flex flex-wrap gap-4">
            {legalLinks.map((link) => (
              <NextLink key={link.href} href={link.href} className="text-xs text-neutral-500 hover:text-white">
                {link.label}
              </NextLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
