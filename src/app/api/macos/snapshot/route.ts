import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dateFromKey, dateKey, macOSAPIUser, monthKey } from "@/lib/macos-api";

type Snapshot = {
  generatedAt: string;
  subcontractors: Array<Record<string, any>>;
  vehicles: Array<Record<string, any>>;
  projects: Array<Record<string, any>>;
  routes: Array<Record<string, any>>;
  assignments: Array<Record<string, any>>;
  expenses: Array<Record<string, any>>;
};

export async function GET(request: Request) {
  const user = await macOSAPIUser(request);
  if (!user) {
    return NextResponse.json({ message: "Bulut oturumu geçersiz." }, { status: 401 });
  }

  const subcontractorId = user.role === "SUBCONTRACTOR" ? user.subcontractorId : undefined;
  const assignments = await prisma.serviceAssignment.findMany({
    where: subcontractorId ? { vehicle: { subcontractorId } } : undefined,
    include: { route: { include: { stops: true } } },
    orderBy: [{ serviceDate: "asc" }, { serviceTime: "asc" }]
  });
  const vehicleIds = new Set(assignments.map((item) => item.vehicleId));
  const routeIds = new Set(assignments.map((item) => item.routeId));
  const projectIds = new Set(assignments.map((item) => item.projectId).filter(Boolean) as string[]);

  const [subcontractors, vehicles, projects, routes, expenses] = await Promise.all([
    prisma.subcontractor.findMany({
      where: subcontractorId ? { id: subcontractorId } : undefined,
      include: { users: { where: { role: "SUBCONTRACTOR" }, select: { loginId: true } } },
      orderBy: { companyName: "asc" }
    }),
    prisma.vehicle.findMany({
      where: subcontractorId
        ? { subcontractorId }
        : undefined,
      orderBy: { fleetNumber: "asc" }
    }),
    prisma.project.findMany({
      where: subcontractorId ? { id: { in: [...projectIds] } } : undefined,
      orderBy: { name: "asc" }
    }),
    prisma.serviceRoute.findMany({
      where: subcontractorId ? { id: { in: [...routeIds] } } : undefined,
      include: { stops: { orderBy: { order: "asc" } } },
      orderBy: { name: "asc" }
    }),
    prisma.expense.findMany({
      where: subcontractorId ? { subcontractorId } : undefined,
      orderBy: { expenseDate: "desc" }
    })
  ]);

  if (subcontractorId) {
    for (const vehicle of vehicles) vehicleIds.add(vehicle.id);
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    subcontractors: subcontractors.map((item) => ({
      id: item.id,
      companyName: item.companyName,
      authorizedPerson: item.authorizedPerson,
      phone: item.phone,
      email: item.email,
      address: item.address,
      taxOffice: item.taxOffice,
      taxNumber: item.taxNumber,
      iban: item.iban,
      notes: item.notes,
      isActive: item.status === "ACTIVE",
      loginId: item.users[0]?.loginId ?? null,
      password: null
    })),
    vehicles: vehicles.map((item) => ({
      id: item.id,
      subcontractorId: item.subcontractorId,
      fleetNumber: item.fleetNumber,
      plateNumber: item.plateNumber,
      make: item.make,
      model: item.model,
      modelYear: item.modelYear,
      capacity: item.capacity,
      status: item.status,
      driverName: item.driverName,
      driverPhone: item.driverPhone
    })),
    projects: projects.map((item) => ({
      id: item.id,
      name: item.name,
      clientCompany: item.clientCompany,
      personnelCount: item.personnelCount,
      status: item.status
    })),
    routes: routes
      .filter((item) => item.projectId)
      .map((item) => ({
        id: item.id,
        projectId: item.projectId,
        name: item.name,
        startPoint: item.startPoint,
        endPoint: item.endPoint,
        notes: null,
        stops: item.stops.map((stop) => ({
          id: stop.id,
          title: stop.title,
          latitude: Number(stop.latitude),
          longitude: Number(stop.longitude),
          order: stop.order
        }))
      })),
    assignments: assignments
      .filter((item) => item.projectId)
      .map((item) => ({
        id: item.id,
        projectId: item.projectId,
        routeId: item.routeId,
        vehicleId: item.vehicleId,
        serviceDate: dateKey(item.serviceDate),
        serviceTime: item.serviceTime.toISOString(),
        direction: item.direction,
        serviceCount: item.serviceCount,
        pricePerService: Number(item.pricePerService),
        clientPricePerService: Number(item.clientPricePerService),
        notes: null
      })),
    expenses: expenses.map((item) => ({
      id: item.id,
      subcontractorId: item.subcontractorId,
      vehicleId: item.vehicleId,
      category: item.category,
      expenseDate: item.expenseDate.toISOString(),
      amount: Number(item.amount),
      notes: item.notes
    }))
  });
}

export async function PUT(request: Request) {
  const user = await macOSAPIUser(request);
  if (!user || user.role !== "MANAGER") {
    return NextResponse.json({ message: "Bulut verisini güncellemek için yönetici yetkisi gerekli." }, { status: 403 });
  }

  const snapshot = await request.json().catch(() => null) as Snapshot | null;
  if (!snapshot || !Array.isArray(snapshot.subcontractors) || !Array.isArray(snapshot.vehicles)) {
    return NextResponse.json({ message: "Eşitleme paketi geçersiz." }, { status: 400 });
  }

  const replaceCloudData = new URL(request.url).searchParams.get("replace") === "local";

  await prisma.$transaction(async (tx) => {
    if (replaceCloudData) {
      await tx.financialDocumentLine.deleteMany();
      await tx.financialDocument.deleteMany();
      await tx.routeStop.deleteMany();
      await tx.driverDocument.deleteMany();
      await tx.serviceAssignment.deleteMany();
      await tx.expense.deleteMany();
      await tx.serviceRoute.deleteMany();
      await tx.project.deleteMany();
      await tx.vehicle.deleteMany();
      await tx.user.deleteMany();
      await tx.subcontractor.deleteMany();
    }

    for (const item of snapshot.subcontractors) {
      await tx.subcontractor.upsert({
        where: { id: String(item.id) },
        create: {
          id: String(item.id),
          companyName: String(item.companyName || "Taşeron"),
          authorizedPerson: String(item.authorizedPerson || "-"),
          phone: String(item.phone || "+90"),
          email: item.email || null,
          address: item.address || null,
          taxOffice: item.taxOffice || null,
          taxNumber: item.taxNumber || null,
          iban: item.iban || null,
          notes: item.notes || null,
          status: item.isActive === false ? "PASSIVE" : "ACTIVE"
        },
        update: {
          companyName: String(item.companyName || "Taşeron"),
          authorizedPerson: String(item.authorizedPerson || "-"),
          phone: String(item.phone || "+90"),
          email: item.email || null,
          address: item.address || null,
          taxOffice: item.taxOffice || null,
          taxNumber: item.taxNumber || null,
          iban: item.iban || null,
          notes: item.notes || null,
          status: item.isActive === false ? "PASSIVE" : "ACTIVE"
        }
      });

      if (item.loginId) {
        const existing = await tx.user.findFirst({ where: { subcontractorId: String(item.id) } });
        const passwordHash = item.password
          ? await bcrypt.hash(String(item.password), 10)
          : existing?.passwordHash ?? await bcrypt.hash("1234", 10);
        await tx.user.upsert({
          where: { loginId: existing?.loginId ?? String(item.loginId) },
          create: {
            loginId: String(item.loginId),
            passwordHash,
            displayName: String(item.companyName || item.loginId),
            role: "SUBCONTRACTOR",
            subcontractorId: String(item.id)
          },
          update: {
            loginId: String(item.loginId),
            passwordHash,
            displayName: String(item.companyName || item.loginId),
            role: "SUBCONTRACTOR",
            subcontractorId: String(item.id)
          }
        });
      }
    }

    for (const item of snapshot.vehicles) {
      await tx.vehicle.upsert({
        where: { id: String(item.id) },
        create: {
          id: String(item.id),
          subcontractorId: item.subcontractorId || null,
          fleetNumber: String(item.fleetNumber || "Araç"),
          plateNumber: String(item.plateNumber || "-"),
          make: item.make || null,
          model: item.model || null,
          modelYear: item.modelYear || null,
          capacity: Number(item.capacity) || 0,
          status: item.status || "ACTIVE",
          driverName: item.driverName || null,
          driverPhone: item.driverPhone || null
        },
        update: {
          subcontractorId: item.subcontractorId || null,
          fleetNumber: String(item.fleetNumber || "Araç"),
          plateNumber: String(item.plateNumber || "-"),
          make: item.make || null,
          model: item.model || null,
          modelYear: item.modelYear || null,
          capacity: Number(item.capacity) || 0,
          status: item.status || "ACTIVE",
          driverName: item.driverName || null,
          driverPhone: item.driverPhone || null
        }
      });
    }

    for (const item of snapshot.projects) {
      await tx.project.upsert({
        where: { id: String(item.id) },
        create: {
          id: String(item.id),
          name: String(item.name || "Proje"),
          clientCompany: String(item.clientCompany || "-"),
          personnelCount: Number(item.personnelCount) || 0,
          status: item.status || "PLANNING"
        },
        update: {
          name: String(item.name || "Proje"),
          clientCompany: String(item.clientCompany || "-"),
          personnelCount: Number(item.personnelCount) || 0,
          status: item.status || "PLANNING"
        }
      });
    }

    for (const item of snapshot.routes) {
      await tx.serviceRoute.upsert({
        where: { id: String(item.id) },
        create: {
          id: String(item.id),
          projectId: String(item.projectId),
          name: String(item.name || "Güzergah"),
          startPoint: String(item.startPoint || "-"),
          endPoint: String(item.endPoint || "-")
        },
        update: {
          projectId: String(item.projectId),
          name: String(item.name || "Güzergah"),
          startPoint: String(item.startPoint || "-"),
          endPoint: String(item.endPoint || "-")
        }
      });
      await tx.routeStop.deleteMany({ where: { routeId: String(item.id) } });
      if (Array.isArray(item.stops) && item.stops.length) {
        await tx.routeStop.createMany({
          data: item.stops.map((stop: Record<string, any>) => ({
            id: String(stop.id),
            routeId: String(item.id),
            title: String(stop.title || "Durak"),
            latitude: Number(stop.latitude) || 0,
            longitude: Number(stop.longitude) || 0,
            order: Number(stop.order) || 0
          }))
        });
      }
    }

    for (const item of snapshot.assignments) {
      const serviceDate = dateFromKey(String(item.serviceDate));
      await tx.serviceAssignment.upsert({
        where: { id: String(item.id) },
        create: {
          id: String(item.id),
          projectId: String(item.projectId),
          routeId: String(item.routeId),
          vehicleId: String(item.vehicleId),
          serviceDate,
          serviceTime: new Date(item.serviceTime),
          direction: item.direction || "MORNING",
          serviceCount: Number(item.serviceCount) || 1,
          pricePerService: Number(item.pricePerService) || 0,
          clientPricePerService: Number(item.clientPricePerService) || 0,
          monthKey: monthKey(serviceDate)
        },
        update: {
          projectId: String(item.projectId),
          routeId: String(item.routeId),
          vehicleId: String(item.vehicleId),
          serviceDate,
          serviceTime: new Date(item.serviceTime),
          direction: item.direction || "MORNING",
          serviceCount: Number(item.serviceCount) || 1,
          pricePerService: Number(item.pricePerService) || 0,
          clientPricePerService: Number(item.clientPricePerService) || 0,
          monthKey: monthKey(serviceDate)
        }
      });
    }

    for (const item of snapshot.expenses) {
      const expenseDate = new Date(item.expenseDate);
      await tx.expense.upsert({
        where: { id: String(item.id) },
        create: {
          id: String(item.id),
          subcontractorId: String(item.subcontractorId),
          vehicleId: item.vehicleId || null,
          category: item.category || "OTHER",
          amount: Number(item.amount) || 0,
          expenseDate,
          monthKey: monthKey(expenseDate),
          notes: item.notes || null
        },
        update: {
          subcontractorId: String(item.subcontractorId),
          vehicleId: item.vehicleId || null,
          category: item.category || "OTHER",
          amount: Number(item.amount) || 0,
          expenseDate,
          monthKey: monthKey(expenseDate),
          notes: item.notes || null
        }
      });
    }
  }, { timeout: 45_000 });

  return NextResponse.json({ ok: true, synchronizedAt: new Date().toISOString() });
}
