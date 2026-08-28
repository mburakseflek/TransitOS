import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { readSessionToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
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
    "/dashboard/:path*",
    "/projects/:path*",
    "/vehicles/:path*",
    "/drivers/:path*",
    "/subcontractors/:path*",
    "/expenses/:path*",
    "/finance/:path*",
    "/calendar/:path*",
    "/earnings/:path*",
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
    "/transitos/surveys/:path*",
    "/transitos/settings/:path*",
    "/transitos/routes/:path*",
    "/site-admin/:path*"
  ]
};
