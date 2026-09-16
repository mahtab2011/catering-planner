import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

/**
 * Which paths next-intl's middleware is allowed to touch. Scoped to
 * exactly "/" plus the active locale prefixes and their sub-paths —
 * every SmartServeUK operational route (/login, /dashboard, /admin,
 * /restaurants/new, /restaurants/[id]/edit, etc.) and every
 * CikenTikka/BlackCab route stays completely outside this check, so
 * intlMiddleware never runs for them. See
 * docs/MULTILINGUAL-ARCHITECTURE.md.
 */
function isLocaleAwarePath(pathname: string) {
  if (pathname === "/") return true;
  return routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;
  const isCikenTikkaDomain = host === "cikentikka.com" || host === "www.cikentikka.com";

  if (isCikenTikkaDomain && pathname === "/") {
    return NextResponse.redirect(new URL("/cikentikka", request.url));
  }

  if (!isCikenTikkaDomain && isLocaleAwarePath(pathname)) {
    return intlMiddleware(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/(en|bn|ar|fr)", "/(en|bn|ar|fr)/:path*"],
};
