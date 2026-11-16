import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readSessionToken } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("transitos_session")?.value;
  const user = token ? await readSessionToken(token).catch(() => null) : null;
  if (user) await recordAudit(user, { action: "LOGOUT", entityType: "AUTH", entityId: user.id, summary: `${user.displayName} TransitOS oturumunu kapattı` });
  cookieStore.delete("transitos_session");
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host") || requestUrl.host;
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol || requestUrl.protocol.replace(":", "");
  return NextResponse.redirect(new URL("/login", `${protocol}://${host}`), 303);
}
