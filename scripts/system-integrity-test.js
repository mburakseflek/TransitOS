const { PrismaClient, UserRole } = require("@prisma/client");

const prisma = new PrismaClient();
let failures = 0;

function check(name, condition, detail = "") {
  const ok = Boolean(condition);
  failures += ok ? 0 : 1;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
}

function localMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

async function main() {
  const [assignments, maintenanceRecords, users, projects] = await Promise.all([
    prisma.serviceAssignment.findMany({
      select: {
        id: true,
        projectId: true,
        routeId: true,
        vehicleId: true,
        serviceDate: true,
        serviceTime: true,
        direction: true,
        monthKey: true,
        route: { select: { projectId: true } }
      }
    }),
    prisma.vehicleMaintenance.findMany({
      where: { vehicle: { fleetTrackingEnabled: false } },
      select: { id: true }
    }),
    prisma.user.findMany({
      select: {
        id: true,
        role: true,
        subcontractorId: true,
        _count: { select: { ownerCompanies: true } }
      }
    }),
    prisma.project.findMany({ select: { id: true, name: true, projectCompanyId: true } })
  ]);

  const mismatchedProjects = assignments.filter((item) => item.projectId !== item.route.projectId);
  check("Servislerin proje ve güzergah ilişkisi tutarlı", mismatchedProjects.length === 0, `${mismatchedProjects.length} sorun`);

  const wrongMonths = assignments.filter((item) => item.monthKey !== localMonthKey(item.serviceDate));
  check("Servislerin ay anahtarları tarihleriyle uyumlu", wrongMonths.length === 0, `${wrongMonths.length} sorun`);

  check("Bakım kayıtları yalnız filo takibindeki araçlara bağlı", maintenanceRecords.length === 0, `${maintenanceRecords.length} sorun`);

  const incompleteProjects = projects.filter((project) => !project.name.trim() || !project.projectCompanyId);
  check("Projelerin adı ve proje şirketi tanımlı", incompleteProjects.length === 0, `${incompleteProjects.length} sorun`);

  const invalidRoleLinks = users.filter((user) =>
    (user.role === UserRole.SUBCONTRACTOR && !user.subcontractorId) ||
    (user.role === UserRole.PROJECT_OWNER && user._count.ownerCompanies === 0)
  );
  check("Kullanıcı rollerinin şirket bağlantıları tamam", invalidRoleLinks.length === 0, `${invalidRoleLinks.length} sorun`);

  const slotCounts = new Map();
  for (const item of assignments) {
    const key = [
      item.routeId,
      item.vehicleId,
      item.serviceDate.toISOString().slice(0, 10),
      `${item.serviceTime.getHours()}:${item.serviceTime.getMinutes()}`,
      item.direction
    ].join("|");
    slotCounts.set(key, (slotCounts.get(key) ?? 0) + 1);
  }
  const duplicateSlots = Array.from(slotCounts.values()).filter((count) => count > 1).length;
  check("Aynı araç ve servis zamanında yinelenen kayıt yok", duplicateSlots === 0, `${duplicateSlots} yinelenen zaman dilimi`);

  if (failures) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(`INTEGRITY_TEST_FAILED ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
