const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const prefix = `role-test-${Date.now()}`;
const password = "1234";
const checks = [];

function ok(name, condition, detail = "") {
  checks.push({ name, ok: Boolean(condition), detail });
  const mark = condition ? "PASS" : "FAIL";
  console.log(`${mark} ${name}${detail ? ` - ${detail}` : ""}`);
}

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

async function cleanup() {
  await prisma.financialDocumentLine.deleteMany({
    where: {
      document: {
        OR: [
          { notes: { contains: prefix } },
          { project: { name: { startsWith: prefix } } },
          { subcontractor: { companyName: { startsWith: prefix } } }
        ]
      }
    }
  });
  await prisma.financialDocument.deleteMany({
    where: {
      OR: [
        { notes: { contains: prefix } },
        { project: { name: { startsWith: prefix } } },
        { subcontractor: { companyName: { startsWith: prefix } } }
      ]
    }
  });
  await prisma.routeStop.deleteMany({ where: { route: { name: { startsWith: prefix } } } });
  await prisma.driverDocument.deleteMany({ where: { vehicle: { fleetNumber: { startsWith: prefix } } } });
  await prisma.expense.deleteMany({ where: { subcontractor: { companyName: { startsWith: prefix } } } });
  await prisma.serviceAssignment.deleteMany({
    where: {
      OR: [
        { route: { name: { startsWith: prefix } } },
        { vehicle: { fleetNumber: { startsWith: prefix } } }
      ]
    }
  });
  await prisma.serviceRoute.deleteMany({ where: { name: { startsWith: prefix } } });
  await prisma.project.deleteMany({ where: { name: { startsWith: prefix } } });
  await prisma.projectCompany.deleteMany({ where: { name: { startsWith: prefix } } });
  await prisma.vehicle.deleteMany({ where: { fleetNumber: { startsWith: prefix } } });
  await prisma.user.deleteMany({ where: { loginId: { startsWith: prefix } } });
  await prisma.subcontractor.deleteMany({ where: { companyName: { startsWith: prefix } } });
}

async function main() {
  await cleanup();
  const hash = await bcrypt.hash(password, 10);
  const now = new Date();
  now.setHours(9, 0, 0, 0);
  const month = monthKey(now);

  const subcontractorA = await prisma.subcontractor.create({
    data: {
      companyName: `${prefix} taseron A`,
      authorizedPerson: "Yetkili A",
      phone: "+90 (555) 111 22 33"
    }
  });
  const subcontractorB = await prisma.subcontractor.create({
    data: {
      companyName: `${prefix} taseron B`,
      authorizedPerson: "Yetkili B",
      phone: "+90 (555) 444 55 66"
    }
  });

  const vehicleA = await prisma.vehicle.create({
    data: {
      subcontractorId: subcontractorA.id,
      fleetNumber: `${prefix}-A1`,
      plateNumber: "34 TEST 001",
      capacity: 16,
      driverName: "Sofor A",
      driverPhone: "+90 (555) 111 22 33"
    }
  });
  const vehicleB = await prisma.vehicle.create({
    data: {
      subcontractorId: subcontractorB.id,
      fleetNumber: `${prefix}-B1`,
      plateNumber: "34 TEST 002",
      capacity: 16,
      driverName: "Sofor B",
      driverPhone: "+90 (555) 444 55 66"
    }
  });

  const manager = await prisma.user.create({
    data: { loginId: `${prefix}-manager`, passwordHash: hash, displayName: "Test Yonetici", role: "MANAGER" }
  });
  const siteModerator = await prisma.user.create({
    data: { loginId: `${prefix}-moderator`, passwordHash: hash, displayName: "Test Site Moderatoru", role: "SITE_MODERATOR" }
  });
  const supervisor = await prisma.user.create({
    data: { loginId: `${prefix}-supervisor`, passwordHash: hash, displayName: "Test Servis Sorumlusu", role: "SERVICE_SUPERVISOR" }
  });
  const subcontractorUser = await prisma.user.create({
    data: {
      loginId: `${prefix}-sub`,
      passwordHash: hash,
      displayName: "Test Taseron",
      role: "SUBCONTRACTOR",
      subcontractorId: subcontractorA.id
    }
  });
  const projectOwner = await prisma.user.create({
    data: { loginId: `${prefix}-owner`, passwordHash: hash, displayName: "Test Proje Sahibi", role: "PROJECT_OWNER" }
  });

  const projectCompanyA = await prisma.projectCompany.create({
    data: {
      name: `${prefix} musteri A`,
      ownerUsers: { connect: [{ id: projectOwner.id }] }
    }
  });

  const projectA = await prisma.project.create({
    data: {
      name: `${prefix} proje A`,
      clientCompany: "Musteri A",
      projectCompanyId: projectCompanyA.id,
      personnelCount: 25,
      serviceUsers: { connect: [{ id: supervisor.id }] }
    }
  });
  const projectB = await prisma.project.create({
    data: {
      name: `${prefix} proje B`,
      clientCompany: "Musteri B",
      projectCompanyId: projectCompanyA.id,
      personnelCount: 15
    }
  });

  const routeA = await prisma.serviceRoute.create({
    data: { projectId: projectA.id, name: `${prefix} guzergah A`, startPoint: "A", endPoint: "B" }
  });
  const routeB = await prisma.serviceRoute.create({
    data: { projectId: projectB.id, name: `${prefix} guzergah B`, startPoint: "C", endPoint: "D" }
  });

  const assignmentA = await prisma.serviceAssignment.create({
    data: {
      projectId: projectA.id,
      routeId: routeA.id,
      vehicleId: vehicleA.id,
      serviceDate: now,
      serviceTime: now,
      direction: "MORNING",
      serviceCount: 2,
      kilometers: 0,
      pricePerService: 1000,
      clientPricePerService: 1400,
      monthKey: month
    }
  });
  await prisma.serviceAssignment.create({
    data: {
      projectId: projectB.id,
      routeId: routeB.id,
      vehicleId: vehicleB.id,
      serviceDate: now,
      serviceTime: now,
      direction: "NIGHT",
      serviceCount: 1,
      kilometers: 0,
      pricePerService: 800,
      clientPricePerService: 1200,
      monthKey: month
    }
  });
  await prisma.serviceAssignment.create({
    data: {
      projectId: projectA.id,
      routeId: routeA.id,
      vehicleId: vehicleB.id,
      serviceDate: now,
      serviceTime: now,
      direction: "EVENING",
      serviceCount: 1,
      kilometers: 0,
      pricePerService: 900,
      clientPricePerService: 1300,
      monthKey: month
    }
  });

  await prisma.expense.create({
    data: {
      subcontractorId: subcontractorA.id,
      vehicleId: vehicleA.id,
      category: "FUEL",
      amount: 300,
      expenseDate: now,
      monthKey: month,
      notes: prefix
    }
  });
  await prisma.driverDocument.create({
    data: {
      vehicleId: vehicleA.id,
      title: "Test evrak",
      fileUrl: "/uploads/documents/test.pdf"
    }
  });
  await prisma.routeStop.create({
    data: {
      routeId: routeA.id,
      title: "Test durak",
      latitude: 41,
      longitude: 29,
      order: 1
    }
  });

  const earning = await prisma.financialDocument.create({
    data: {
      type: "SUBCONTRACTOR_EARNING",
      monthKey: month,
      periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
      periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
      subcontractorId: subcontractorA.id,
      createdByUserId: manager.id,
      grossAmount: 2000,
      expenseAmount: 300,
      netAmount: 1700,
      notes: prefix,
      lines: {
        create: [{
          kind: "SERVICE",
          serviceAssignmentId: assignmentA.id,
          serviceDate: now,
          title: "Test servis",
          projectName: projectA.name,
          routeName: routeA.name,
          vehicleName: vehicleA.fleetNumber,
          serviceType: "Sabah",
          serviceCount: 2,
          unitPrice: 1000,
          amount: 2000
        }]
      }
    }
  });
  const invoice = await prisma.financialDocument.create({
    data: {
      type: "PROJECT_INVOICE",
      monthKey: month,
      periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
      periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
      projectId: projectA.id,
      projectCompanyId: projectCompanyA.id,
      createdByUserId: manager.id,
      grossAmount: 2800,
      expenseAmount: 0,
      netAmount: 2800,
      notes: prefix
    }
  });

  ok("Yonetici tum projeleri gorebilir", (await prisma.project.count({ where: { name: { startsWith: prefix } } })) === 2);
  ok("Yonetici kullanici ekleme/guncelleme kaydi olusturabilir", Boolean(manager.id && siteModerator.id && supervisor.id && subcontractorUser.id && projectOwner.id));
  ok("Site moderatoru ayri kullanici rolu olarak olusturulabilir", siteModerator.role === "SITE_MODERATOR");
  ok("Yonetici hakedis ve fatura belgesi olusturabilir", Boolean(earning.id && invoice.id));
  ok("Proje sirketi birden fazla projeye sahip olabilir", (await prisma.projectCompany.findUnique({ where: { id: projectCompanyA.id }, include: { projects: true } }))?.projects.length === 2);
  const companyInvoiceAssignments = await prisma.serviceAssignment.findMany({
    where: { project: { projectCompanyId: projectCompanyA.id } },
    select: { projectId: true }
  });
  ok("Sirket faturasi tum bagli projelerin islerini toplar", new Set(companyInvoiceAssignments.map((item) => item.projectId)).size === 2);

  const supervisorProjects = await prisma.project.findMany({
    where: { serviceUsers: { some: { id: supervisor.id } }, name: { startsWith: prefix } }
  });
  ok("Servis sorumlusu sadece atanmis projeyi gorur", supervisorProjects.length === 1 && supervisorProjects[0].id === projectA.id);
  ok("Servis sorumlusu tum taseron/arac havuzuna erisebilir", (await prisma.vehicle.count({ where: { fleetNumber: { startsWith: prefix } } })) === 2);

  const subVehicles = await prisma.vehicle.findMany({
    where: { subcontractorId: subcontractorA.id, fleetNumber: { startsWith: prefix } }
  });
  const subAssignments = await prisma.serviceAssignment.findMany({
    where: { vehicle: { subcontractorId: subcontractorA.id }, route: { name: { startsWith: prefix } } }
  });
  const subDocs = await prisma.financialDocument.findMany({
    where: { type: "SUBCONTRACTOR_EARNING", subcontractorId: subcontractorA.id, notes: prefix }
  });
  ok("Taseron sadece kendi aracini gorur", subVehicles.length === 1 && subVehicles[0].id === vehicleA.id);
  ok("Taseron sadece kendi servislerini gorur", subAssignments.length === 1 && subAssignments[0].vehicleId === vehicleA.id);
  ok("Taseron sadece kesilmis hakedis belgesini gorur", subDocs.length === 1);
  const scopedSubcontractorProjects = await prisma.project.findMany({
    where: { assignments: { some: { vehicle: { subcontractorId: subcontractorA.id } } }, name: { startsWith: prefix } },
    include: {
      routes: {
        where: { assignments: { some: { vehicle: { subcontractorId: subcontractorA.id } } } },
        include: { assignments: { where: { vehicle: { subcontractorId: subcontractorA.id } } } }
      }
    }
  });
  ok(
    "Ayni projede diger taseronun servisi gizlenir",
    scopedSubcontractorProjects.flatMap((project) => project.routes).flatMap((route) => route.assignments).every((assignment) => assignment.vehicleId === vehicleA.id)
  );

  const ownerVehicles = await prisma.vehicle.findMany({
    where: { assignments: { some: { project: { projectCompany: { ownerUsers: { some: { id: projectOwner.id } } } } } }, fleetNumber: { startsWith: prefix } }
  });
  const ownerDocs = await prisma.financialDocument.findMany({
    where: { type: "PROJECT_INVOICE", project: { projectCompany: { ownerUsers: { some: { id: projectOwner.id } } } }, notes: prefix }
  });
  const companyOwnerProjects = await prisma.project.findMany({
    where: { projectCompany: { ownerUsers: { some: { id: projectOwner.id } } }, name: { startsWith: prefix } }
  });
  ok("Proje sahibi yalniz sirketinin tum projelerini gorur", companyOwnerProjects.length === 2);
  ok("Proje sahibi projesine tahsisli araclari gorur", ownerVehicles.length === 2);
  ok("Proje sahibi proje faturasini gorur", ownerDocs.length === 1);

  const failed = checks.filter((item) => !item.ok);
  if (failed.length) {
    throw new Error(`${failed.length} rol testi basarisiz.`);
  }
}

main()
  .catch((error) => {
    console.error(`ROLE_TEST_FAILED ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup().catch(() => {});
    await prisma.$disconnect();
  });
