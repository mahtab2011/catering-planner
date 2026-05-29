import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  const isCikenTikkaDomain =
    host === "cikentikka.com" ||
    host === "www.cikentikka.com";

  if (isCikenTikkaDomain && pathname === "/") {
    return NextResponse.redirect(
      new URL("/cikentikka", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};