import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

const loginSchema = z.object({
  role: z.enum(["MANAGER", "SITE_MODERATOR", "SERVICE_SUPERVISOR", "SUBCONTRACTOR", "PROJECT_OWNER"]),
  loginId: z.string().min(1),
  password: z.string().min(1),
  next: z.string().optional()
});

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isFormSubmit = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
  const rawBody = isFormSubmit
    ? Object.fromEntries((await request.formData()).entries())
    : await request.json();
  const body = loginSchema.safeParse(rawBody);
  if (!body.success) {
    return loginFailure(request, isFormSubmit, "Eksik bilgi.");
  }

  const { role, password, next } = body.data;
  const loginId = body.data.loginId.trim();
  const adminId = process.env.ADMIN_LOGIN_ID ?? "admin";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";
  const successPath = role === "SITE_MODERATOR" ? "/site-admin" : safeNextPath(next);

  if (role === "MANAGER") {
    const isBuiltInAdmin = adminPassword.length > 0 && loginId.trim().toLowerCase() === adminId.toLowerCase() && password === adminPassword;
    if (!isBuiltInAdmin) {
      const manager = await findUserByLoginId(loginId);
      const managerPasswordMatches = manager?.role === "MANAGER" ? await bcrypt.compare(password, manager.passwordHash) : false;
      if (!manager || manager.role !== "MANAGER" || !managerPasswordMatches) {
        return loginFailure(request, isFormSubmit, "Giriş bilgileri hatalı.", next);
      }

      const token = await createSessionToken({
        id: manager.id,
        displayName: manager.displayName,
        role: "MANAGER"
      });

      const cookieStore = await cookies();
      cookieStore.set("transitos_session", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/"
      });

      return loginSuccess(request, isFormSubmit, successPath);
    }

    const token = await createSessionToken({
      id: "admin",
      displayName: "Şeflek Tur",
      role: "MANAGER"
    });

    const cookieStore = await cookies();
    cookieStore.set("transitos_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/"
    });

    return loginSuccess(request, isFormSubmit, successPath);
  }

  const user = await findUserByLoginId(loginId);

  if (!user || user.role !== role) {
    return loginFailure(request, isFormSubmit, "Giriş bilgileri hatalı.", next);
  }

  if (user.role === "SUBCONTRACTOR" && (!user.subcontractor || user.subcontractor.status !== "ACTIVE")) {
    return loginFailure(request, isFormSubmit, "Giriş bilgileri hatalı.", next);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return loginFailure(request, isFormSubmit, "Giriş bilgileri hatalı.", next);
  }

  const token = await createSessionToken({
    id: user.id,
    displayName: user.displayName,
    role: user.role,
    subcontractorId: user.subcontractorId ?? undefined,
    projectIds: user.role === "SERVICE_SUPERVISOR"
      ? user.serviceProjects.map((project) => project.id)
      : user.role === "PROJECT_OWNER"
        ? [...new Set(user.ownerCompanies.flatMap((company) => company.projects.map((project) => project.id)))]
        : undefined
  });

  const cookieStore = await cookies();
  cookieStore.set("transitos_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  return loginSuccess(request, isFormSubmit, successPath);
}

async function findUserByLoginId(loginId: string) {
  return prisma.user.findFirst({
    where: { loginId: { equals: loginId, mode: "insensitive" } },
    select: {
      id: true,
      loginId: true,
      passwordHash: true,
      displayName: true,
      role: true,
      subcontractorId: true,
      subcontractor: { select: { status: true } },
      serviceProjects: { select: { id: true } },
      ownerProjects: { select: { id: true } },
      ownerCompanies: { select: { projects: { select: { id: true } } } }
    }
  });
}

function safeNextPath(next?: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/transitos/dashboard";
}

function loginSuccess(request: Request, isFormSubmit: boolean, next: string) {
  if (!isFormSubmit) return NextResponse.json({ ok: true });
  return NextResponse.redirect(redirectUrl(request, next), { status: 303 });
}

function loginFailure(request: Request, isFormSubmit: boolean, message: string, next?: string) {
  if (!isFormSubmit) {
    return NextResponse.json({ message }, { status: message === "Eksik bilgi." ? 400 : 401 });
  }
  const url = redirectUrl(request, "/login");
  url.searchParams.set("error", message);
  url.searchParams.set("next", safeNextPath(next));
  return NextResponse.redirect(url, { status: 303 });
}

function redirectUrl(request: Request, path: string) {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host") || requestUrl.host;
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol || requestUrl.protocol.replace(":", "");
  return new URL(path, `${protocol}://${host}`);
}
