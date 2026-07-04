const { execFileSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const { join } = require("node:path");
const { homedir } = require("node:os");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const appStorePath = process.env.TRANSITOS_APP_STORE || join(homedir(), "Documents/TransitOS/Veritabani/TransitOSLocalStoreV20.store");
const appleEpoch = Date.UTC(2001, 0, 1, 0, 0, 0);

function sql(query) {
  if (!existsSync(appStorePath)) {
    throw new Error(`TransitOS uygulama veri deposu bulunamadı: ${appStorePath}`);
  }
  const output = execFileSync("sqlite3", ["-json", appStorePath, query], { encoding: "utf8" });
  return output.trim() ? JSON.parse(output) : [];
}

function dateFromAppleSeconds(value, fallback = new Date()) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds)) return fallback;
  return new Date(appleEpoch + seconds * 1000);
}

function dateFromKey(value) {
  const [year, month, day] = String(value).trim().split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 12, 0, 0);
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function direction(value) {
  const normalized = String(value || "").toLocaleLowerCase("tr-TR");
  if (normalized.includes("akşam")) return "EVENING";
  if (normalized.includes("gece")) return "NIGHT";
  if (normalized.includes("mesai")) return "OVERTIME";
  if (normalized.includes("tek")) return "ONE_OFF";
  return "MORNING";
}

function status(value) {
  const normalized = String(value || "").toLocaleLowerCase("tr-TR");
  if (normalized.includes("pasif") || normalized.includes("servis dışı")) return "PASSIVE";
  if (normalized.includes("bakım")) return "MAINTENANCE";
  if (normalized.includes("tamam")) return "COMPLETED";
  if (normalized.includes("plan")) return "PLANNING";
  return "ACTIVE";
}

function expenseCategory(value) {
  const normalized = String(value || "").toLocaleLowerCase("tr-TR");
  if (normalized.includes("avans")) return "ADVANCE";
  if (normalized.includes("yakıt")) return "FUEL";
  if (normalized.includes("işlem")) return "COMPANY_PROCESSING_FEE";
  if (normalized.includes("sigorta")) return "SEAT_INSURANCE";
  if (normalized.includes("ceza")) return "FINE";
  if (normalized.includes("taksi")) return "TAXI_FEE";
  return "OTHER";
}

function plannedDates(text, fallbackCount) {
  const dates = String(text || "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item));
  if (dates.length) return dates;
  const today = new Date();
  return Array.from({ length: Math.max(Number(fallbackCount) || 1, 1) }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  });
}

function timeOnDate(date, appleSeconds) {
  const source = dateFromAppleSeconds(appleSeconds, date);
  const next = new Date(date);
  next.setHours(source.getHours(), source.getMinutes(), 0, 0);
  return next;
}

async function clearCloudData() {
  await prisma.financialDocumentLine.deleteMany();
  await prisma.financialDocument.deleteMany();
  await prisma.routeStop.deleteMany();
  await prisma.driverDocument.deleteMany();
  await prisma.serviceAssignment.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.serviceRoute.deleteMany();
  await prisma.project.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subcontractor.deleteMany();
}

async function main() {
  const subcontractors = sql(`select hex(ZID) id, ZCOMPANYNAME companyName, ZAUTHORIZEDPERSON authorizedPerson, ZLOGINID loginId, ZPASSWORD password, ZPHONE phone, ZEMAIL email, ZTAXOFFICE taxOffice, ZTAXNUMBER taxNumber, ZIBAN iban, ZADDRESS address, ZNOTES notes, ZISACTIVE isActive from ZSUBCONTRACTOR order by ZCOMPANYNAME`);
  const vehicles = sql(`select hex(ZID) id, hex(ZSUBCONTRACTORID) subcontractorId, ZFLEETNUMBER fleetNumber, ZPLATENUMBER plateNumber, ZMAKE make, ZMODEL model, ZMODELYEAR modelYear, ZCAPACITY capacity, ZDRIVERFULLNAME driverName, ZDRIVERPHONE driverPhone, ZSTATUSRAWVALUE status from ZVEHICLE order by ZFLEETNUMBER`);
  const projects = sql(`select hex(ZID) id, ZNAME name, ZCLIENTNAME clientCompany, ZPERSONNELCOUNT personnelCount, ZSTATUSRAWVALUE status from ZTRANSITPROJECT order by ZNAME`);
  const routes = sql(`select hex(ZID) id, hex(ZPROJECTID) projectId, ZNAME name, ZSTARTPOINT startPoint, ZENDPOINT endPoint, ZDAYSPERMONTH standardWorkDays, ZAVERAGEKILOMETERS averageKilometers from ZPROJECTSERVICEROUTE order by ZNAME`);
  const assignments = sql(`select hex(ZID) id, hex(ZPROJECTID) projectId, hex(ZROUTEID) routeId, hex(ZVEHICLEID) vehicleId, ZDIRECTIONRAWVALUE direction, ZPLANNEDDAYS plannedDays, ZSERVICESPERDAY serviceCount, ZAVERAGEKILOMETERS kilometers, ZPRICEPERSERVICE pricePerService, ZSERVICETIME serviceTime, ZPLANNEDDATESTEXT plannedDatesText from ZPROJECTVEHICLEASSIGNMENT order by ZCREATEDAT`);
  const expenses = sql(`select hex(ZID) id, hex(ZSUBCONTRACTORID) subcontractorId, hex(ZVEHICLEID) vehicleId, ZCATEGORYRAWVALUE category, ZAMOUNT amount, ZEXPENSEDATE expenseDate, ZMONTHKEY monthKey, ZNOTES notes from ZSUBCONTRACTOREXPENSE order by ZEXPENSEDATE`);
  const routePlans = sql(`select Z_PK pk, hex(ZSERVICEROUTEID) routeId from ZROUTEPLAN`);
  const waypoints = sql(`select Z6WAYPOINTS routePlanPk, hex(ZID) id, ZORDER stopOrder, ZTITLE title, ZLATITUDE latitude, ZLONGITUDE longitude from ZROUTEWAYPOINT order by Z6WAYPOINTS, ZORDER`);
  const subcontractorIds = new Set(subcontractors.map((item) => item.id).filter(Boolean));
  const projectIds = new Set(projects.map((item) => item.id).filter(Boolean));
  const vehicleIds = new Set(vehicles.map((item) => item.id).filter(Boolean));
  const routeIds = new Set(routes.map((item) => item.id).filter(Boolean));
  const routeProjectById = new Map();
  const routeDefaultPrices = new Map();
  const skipped = {
    vehicles: 0,
    routesWithMissingProject: 0,
    assignments: 0,
    expenses: 0,
    stops: 0
  };

  for (const item of assignments) {
    const price = Number(item.pricePerService) || 0;
    if (item.routeId && price > 0 && !routeDefaultPrices.has(item.routeId)) {
      routeDefaultPrices.set(item.routeId, price);
    }
  }

  await clearCloudData();

  for (const item of subcontractors) {
    await prisma.subcontractor.create({
      data: {
        id: item.id,
        companyName: item.companyName || "Taşeron",
        authorizedPerson: item.authorizedPerson || "-",
        phone: item.phone || "+90",
        email: item.email || null,
        taxOffice: item.taxOffice || null,
        taxNumber: item.taxNumber ? String(item.taxNumber) : null,
        iban: item.iban || null,
        address: item.address || null,
        notes: item.notes || null,
        status: Number(item.isActive) === 0 ? "PASSIVE" : "ACTIVE"
      }
    });

    if (item.loginId) {
      const loginId = String(item.loginId);
      await prisma.user.upsert({
        where: { loginId },
        create: {
          loginId,
          passwordHash: await bcrypt.hash(String(item.password || "1234"), 10),
          displayName: item.companyName || loginId,
          role: "SUBCONTRACTOR",
          subcontractorId: item.id
        },
        update: {
          passwordHash: await bcrypt.hash(String(item.password || "1234"), 10),
          displayName: item.companyName || loginId,
          role: "SUBCONTRACTOR",
          subcontractorId: item.id,
          serviceProjects: { set: [] },
          ownerProjects: { set: [] }
        }
      });
    }
  }

  for (const item of vehicles) {
    await prisma.vehicle.create({
      data: {
        id: item.id,
        subcontractorId: subcontractorIds.has(item.subcontractorId) ? item.subcontractorId : null,
        fleetNumber: item.fleetNumber || "Araç",
        plateNumber: item.plateNumber || "-",
        make: item.make || null,
        model: item.model || null,
        modelYear: item.modelYear ? Number(item.modelYear) : null,
        capacity: Number(item.capacity) || 0,
        status: status(item.status),
        driverName: item.driverName || null,
        driverPhone: item.driverPhone || null
      }
    });
  }

  for (const item of projects) {
    await prisma.project.create({
      data: {
        id: item.id,
        name: item.name || "Proje",
        clientCompany: item.clientCompany || "-",
        personnelCount: Number(item.personnelCount) || 0,
        status: status(item.status)
      }
    });
  }

  for (const item of routes) {
    const projectId = projectIds.has(item.projectId) ? item.projectId : null;
    if (item.projectId && !projectId) skipped.routesWithMissingProject += 1;
    routeProjectById.set(item.id, projectId);
    const defaultPrice = routeDefaultPrices.get(item.id) ?? 0;
    await prisma.serviceRoute.create({
      data: {
        id: item.id,
        projectId,
        name: item.name || "Güzergah",
        startPoint: item.startPoint || "-",
        endPoint: item.endPoint || "-",
        averageKilometers: Number(item.averageKilometers) || 0,
        mapDistanceKm: Number(item.averageKilometers) || 0,
        standardWorkDays: 0,
        defaultCarrierPricePerService: defaultPrice,
        defaultClientPricePerService: defaultPrice
      }
    });
  }

  for (const item of assignments) {
    if (!routeIds.has(item.routeId) || !vehicleIds.has(item.vehicleId)) {
      skipped.assignments += 1;
      continue;
    }
    const projectId = projectIds.has(item.projectId) ? item.projectId : routeProjectById.get(item.routeId) || null;
    const dates = plannedDates(item.plannedDatesText, item.plannedDays);
    for (const dateKey of dates) {
      const serviceDate = dateFromKey(dateKey);
      await prisma.serviceAssignment.create({
        data: {
          projectId,
          routeId: item.routeId,
          vehicleId: item.vehicleId,
          serviceDate,
          serviceTime: timeOnDate(serviceDate, item.serviceTime),
          direction: direction(item.direction),
          serviceCount: Number(item.serviceCount) || 1,
          kilometers: Number(item.kilometers) || 0,
          pricePerService: Number(item.pricePerService) || 0,
          clientPricePerService: Number(item.pricePerService) || 0,
          monthKey: monthKey(serviceDate)
        }
      });
    }
  }

  for (const item of expenses) {
    if (!subcontractorIds.has(item.subcontractorId)) {
      skipped.expenses += 1;
      continue;
    }
    const expenseDate = dateFromAppleSeconds(item.expenseDate);
    await prisma.expense.create({
      data: {
        id: item.id,
        subcontractorId: item.subcontractorId,
        vehicleId: vehicleIds.has(item.vehicleId) ? item.vehicleId : null,
        category: expenseCategory(item.category),
        amount: Number(item.amount) || 0,
        expenseDate,
        monthKey: item.monthKey || monthKey(expenseDate),
        notes: item.notes || null
      }
    });
  }

  const planRouteByPk = new Map(routePlans.map((plan) => [Number(plan.pk), plan.routeId]));
  for (const waypoint of waypoints) {
    const routeId = planRouteByPk.get(Number(waypoint.routePlanPk));
    if (!routeId || !routeIds.has(routeId)) {
      skipped.stops += 1;
      continue;
    }
    await prisma.routeStop.create({
      data: {
        id: waypoint.id,
        routeId,
        title: waypoint.title || "Durak",
        latitude: Number(waypoint.latitude) || 0,
        longitude: Number(waypoint.longitude) || 0,
        order: Number(waypoint.stopOrder) || 0
      }
    });
  }

  console.log(`TransitOS app verileri web'e aktarıldı: ${subcontractors.length} taşeron, ${vehicles.length} araç, ${projects.length} proje, ${routes.length} güzergah, ${assignments.length} plan.`);
  if (Object.values(skipped).some(Boolean)) {
    console.log(`Eksik bağlantı nedeniyle atlanan/düzeltilen kayıtlar: ${JSON.stringify(skipped)}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
