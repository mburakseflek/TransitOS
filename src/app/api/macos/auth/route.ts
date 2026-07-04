import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  role: z.enum(["MANAGER", "SUBCONTRACTOR"]),
  loginId: z.string().min(1),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Giriş bilgileri eksik." }, { status: 400 });
  }

  const { role, loginId, password } = parsed.data;
  const normalizedLogin = loginId.trim();
  const adminId = process.env.ADMIN_LOGIN_ID ?? "admin";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";

  if (role === "MANAGER" && adminPassword.length > 0 && normalizedLogin.toLowerCase() === adminId.toLowerCase() && password === adminPassword) {
    const user = {
      id: "admin",
      displayName: "Şeflek Tur",
      role: "MANAGER" as const
    };
    return NextResponse.json({
      token: await createSessionToken(user),
      user
    });
  }

  const databaseUser = await prisma.user.findUnique({
    where: { loginId: normalizedLogin },
    include: { subcontractor: true }
  });
  const passwordMatches = databaseUser
    ? await bcrypt.compare(password, databaseUser.passwordHash)
    : false;

  if (
    !databaseUser ||
    databaseUser.role !== role ||
    !passwordMatches ||
    (role === "SUBCONTRACTOR" && databaseUser.subcontractor?.status !== "ACTIVE")
  ) {
    return NextResponse.json({ message: "Giriş bilgileri hatalı." }, { status: 401 });
  }

  const user = {
    id: databaseUser.id,
    displayName: databaseUser.displayName,
    role: databaseUser.role,
    subcontractorId: databaseUser.subcontractorId ?? undefined
  };
  return NextResponse.json({
    token: await createSessionToken(user),
    user
  });
}
