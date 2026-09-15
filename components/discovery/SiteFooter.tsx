import Link from "next/link";

const DISCOVER_LINKS = [
  { label: "Restaurants", href: "/restaurants" },
  { label: "Cuisines", href: "/cuisines" },
  { label: "Food Hubs", href: "/hubs" },
  { label: "Search", href: "/search" },
];

const EDITORIAL_LINKS = [
  { label: "Blog", href: "/blog" },
  { label: "Recommendations", href: "/recommendations" },
  { label: "Reviews", href: "/reviews" },
];

const BUSINESS_LINKS = [
  { label: "List Your Business", href: "/signup/restaurant" },
  { label: "Restaurant Onboarding Guide", href: "/restaurant-onboarding-guide" },
  { label: "Business Login", href: "/login" },
];

const ACCOUNT_LINKS = [
  { label: "Create Account", href: "/create-account" },
  { label: "Log In", href: "/login" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookie Policy", href: "/cookie-policy" },
];

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <div className="text-sm font-semibold text-white">{title}</div>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link href={link.href} className="text-sm text-neutral-400 hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SiteFooter() {
  return (
    <footer className="bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <FooterColumn title="Discover" links={DISCOVER_LINKS} />
          <FooterColumn title="Editorial" links={EDITORIAL_LINKS} />
          <FooterColumn title="For Businesses" links={BUSINESS_LINKS} />
          <FooterColumn title="Account" links={ACCOUNT_LINKS} />
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-neutral-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-500">
            © {new Date().getFullYear()} London Food Hubs, powered by SmartServeUK.
          </p>
          <div className="flex flex-wrap gap-4">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-xs text-neutral-500 hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
