import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

const loginSchema = z.object({
  role: z.enum(["MANAGER", "SERVICE_SUPERVISOR", "SUBCONTRACTOR", "PROJECT_OWNER"]),
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

  const { role, loginId, password, next } = body.data;
  const adminId = process.env.ADMIN_LOGIN_ID ?? "admin";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "seflektur";
  const successPath = safeNextPath(next);

  if (role === "MANAGER") {
    const isBuiltInAdmin = loginId.trim().toLowerCase() === adminId && password === adminPassword;
    if (!isBuiltInAdmin) {
      const manager = await prisma.user.findUnique({ where: { loginId: loginId.trim() } });
      const managerPasswordMatches = manager ? await bcrypt.compare(password, manager.passwordHash) : false;
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

  const user = await prisma.user.findUnique({
    where: { loginId: loginId.trim() },
    include: { subcontractor: true, serviceProjects: true, ownerProjects: true }
  });

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
        ? user.ownerProjects.map((project) => project.id)
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

function safeNextPath(next?: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/transitos/dashboard";
}

function loginSuccess(request: Request, isFormSubmit: boolean, next: string) {
  if (!isFormSubmit) return NextResponse.json({ ok: true });
  return NextResponse.redirect(new URL(next, request.url), { status: 303 });
}

function loginFailure(request: Request, isFormSubmit: boolean, message: string, next?: string) {
  if (!isFormSubmit) {
    return NextResponse.json({ message }, { status: message === "Eksik bilgi." ? 400 : 401 });
  }
  const url = new URL("/login", request.url);
  url.searchParams.set("error", message);
  url.searchParams.set("next", safeNextPath(next));
  return NextResponse.redirect(url, { status: 303 });
}
