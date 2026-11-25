import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { readSessionToken } from "@/lib/auth";
import { languages } from "@/lib/languages";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const preferred = request.cookies.get("site_language")?.value;
    const language = request.headers.get("accept-language")?.split(",")[0]?.toLowerCase() || "tr";
    const code = preferred && languages.some(item => item.code === preferred)
      ? preferred : language.startsWith("tr") ? "tr" : "eng";
    const response = NextResponse.redirect(new URL(code === "tr" ? "/seflektur" : `/${code}`, request.url));
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Vary", "Cookie, Accept-Language");
    return response;
  }
  const token = request.cookies.get("transitos_session")?.value;
  const user = token ? await readSessionToken(token).catch(() => null) : null;

  if (user?.role) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  const response = NextResponse.redirect(loginUrl);

  if (token) response.cookies.delete("transitos_session");
  return response;
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/projects/:path*",
    "/vehicles/:path*",
    "/drivers/:path*",
    "/subcontractors/:path*",
    "/expenses/:path*",
    "/finance/:path*",
    "/calendar/:path*",
    "/earnings/:path*",
    "/maintenance/:path*",
    "/surveys/:path*",
    "/settings/:path*",
    "/routes/:path*",
    "/transitos/dashboard/:path*",
    "/transitos/projects/:path*",
    "/transitos/vehicles/:path*",
    "/transitos/drivers/:path*",
    "/transitos/subcontractors/:path*",
    "/transitos/expenses/:path*",
    "/transitos/finance/:path*",
    "/transitos/calendar/:path*",
    "/transitos/earnings/:path*",
    "/transitos/maintenance/:path*",
    "/transitos/surveys/:path*",
    "/transitos/settings/:path*",
    "/transitos/routes/:path*",
    "/site-admin/:path*"
  ]
};
