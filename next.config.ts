import type { NextConfig } from "next";

// Legacy hardcoded cuisine pages (app/<slug>/page.tsx) are superseded by
// the data-driven app/cuisine/[slug] route backed by lib/cuisines.ts.
// The old page files are intentionally left in place (not deleted) so
// the redirect can be rolled back instantly if needed; they are simply
// unreachable while this redirect is active.
const LEGACY_CUISINE_SLUGS = [
  "african-food-london",
  "american-food-london",
  "bangladeshi-food-east-london",
  "biryani-polao-london",
  "brazilian-food-london",
  "british-food-london",
  "chicken-tikka-london",
  "indian-food-london",
  "jamaican-food-london",
  "japanese-food-london",
  "lebanese-food-london",
  "mexican-food-london",
  "pakistani-food-london",
  "thai-food-london",
  "turkish-food-london",
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://127.0.0.1:3000", "http://localhost:3000"],
  async redirects() {
    return [
      ...LEGACY_CUISINE_SLUGS.map((slug) => ({
        source: `/${slug}`,
        destination: `/cuisine/${slug}`,
        permanent: false,
      })),
      // "edgware-road-arabian-food-hub" was a duplicate stub page for the
      // same physical place as the richer, data-driven /hubs/edgware-road.
      {
        source: "/hubs/edgware-road-arabian-food-hub",
        destination: "/hubs/edgware-road",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;