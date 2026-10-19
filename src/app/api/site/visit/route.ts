import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { istanbulDateKey, recordDailyVisitor } from "@/lib/site-analytics";

const VISITOR_COOKIE = "seflek_visitor_day";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Geçersiz istek." }, { status: 403 });
  }

  const dateKey = istanbulDateKey();
  const cookieStore = await cookies();
  if (cookieStore.get(VISITOR_COOKIE)?.value === dateKey) {
    return noStoreResponse({ counted: false });
  }

  await recordDailyVisitor();
  const response = noStoreResponse({ counted: true });
  response.cookies.set(VISITOR_COOKIE, dateKey, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 48
  });
  return response;
}

function noStoreResponse(body: { counted: boolean }) {
  return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
}

function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host") || requestUrl.host;
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol || requestUrl.protocol.replace(":", "");
  return origin === `${protocol}://${host}`;
}
