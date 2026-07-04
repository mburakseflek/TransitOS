import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
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
