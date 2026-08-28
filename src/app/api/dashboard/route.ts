import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const token = (await cookies()).get("transitos_session")?.value;
  const user = token ? await readSessionToken(token).catch(() => null) : null;
  if (!user || user.role === "SITE_MODERATOR") {
    return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 401 });
  }

  const [subcontractors, vehicles, activeProjects, todayServices] = await Promise.all([
    prisma.subcontractor.count(),
    prisma.vehicle.count(),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.serviceAssignment.count()
  ]);

  return NextResponse.json({
    summary: {
      subcontractors,
      vehicles,
      activeProjects,
      todayServices
    }
  });
}
