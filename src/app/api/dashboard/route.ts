import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const token = (await cookies()).get("transitos_session")?.value;
  const user = token ? await readSessionToken(token).catch(() => null) : null;
  if (!user || user.role !== "MANAGER") {
    return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 401 });
  }

  const now = new Date();
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const start = new Date(`${date}T00:00:00+03:00`);
  const end = new Date(start.getTime() + 86400000);
  const [subcontractors, vehicles, activeProjects, todayServices] = await Promise.all([
    prisma.subcontractor.count(),
    prisma.vehicle.count(),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.serviceAssignment.count({ where: { serviceDate: { gte: start, lt: end } } })
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
