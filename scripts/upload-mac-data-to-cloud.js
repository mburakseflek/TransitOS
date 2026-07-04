const { execFileSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const { join } = require("node:path");
const { homedir } = require("node:os");

const appStorePath = process.env.TRANSITOS_APP_STORE || join(homedir(), "Documents/TransitOS/Veritabani/TransitOSLocalStoreV20.store");
const cloudURL = (process.env.TRANSITOS_CLOUD_URL || process.env.NEXT_PUBLIC_TRANSITOS_CLOUD_URL || "https://www.seflektur.com").replace(/\/$/, "");
const loginId = process.env.ADMIN_LOGIN_ID || "admin";
const password = process.env.ADMIN_PASSWORD || "";
const appleEpoch = Date.UTC(2001, 0, 1, 0, 0, 0);

function sql(query) {
  if (!existsSync(appStorePath)) {
    throw new Error(`TransitOS yerel veri deposu bulunamadı: ${appStorePath}`);
  }
  const output = execFileSync("sqlite3", ["-json", appStorePath, query], { encoding: "utf8" });
  return output.trim() ? JSON.parse(output) : [];
}

function firstExistingColumn(tableName, candidates) {
  const columns = new Set(sql(`PRAGMA table_info(${tableName})`).map((item) => item.name));
  return candidates.find((candidate) => columns.has(candidate)) || candidates[0];
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

function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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

function plannedDates(text, fallbackDate, fallbackCount) {
  const dates = String(text || "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item));
  if (dates.length) return dates;
  if (fallbackDate) return [dayKey(dateFromAppleSeconds(fallbackDate))];

  const today = new Date();
  return Array.from({ length: Math.max(Number(fallbackCount) || 1, 1) }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return dayKey(date);
  });
}

function timeOnDate(date, appleSeconds) {
  const source = dateFromAppleSeconds(appleSeconds, date);
  const next = new Date(date);
  next.setHours(source.getHours(), source.getMinutes(), 0, 0);
  return next.toISOString();
}

function makeSnapshot() {
  const subcontractors = sql(`select hex(ZID) id, ZCOMPANYNAME companyName, ZAUTHORIZEDPERSON authorizedPerson, ZLOGINID loginId, ZPASSWORD password, ZPHONE phone, ZEMAIL email, ZTAXOFFICE taxOffice, ZTAXNUMBER taxNumber, ZIBAN iban, ZADDRESS address, ZNOTES notes, ZISACTIVE isActive from ZSUBCONTRACTOR order by ZCOMPANYNAME`);
  const vehicles = sql(`select hex(ZID) id, hex(ZSUBCONTRACTORID) subcontractorId, ZFLEETNUMBER fleetNumber, ZPLATENUMBER plateNumber, ZMAKE make, ZMODEL model, ZMODELYEAR modelYear, ZCAPACITY capacity, ZDRIVERFULLNAME driverName, ZDRIVERPHONE driverPhone, ZSTATUSRAWVALUE status from ZVEHICLE order by ZFLEETNUMBER`);
  const projects = sql(`select hex(ZID) id, ZNAME name, ZCLIENTNAME clientCompany, ZPERSONNELCOUNT personnelCount, ZSTATUSRAWVALUE status from ZTRANSITPROJECT order by ZNAME`);
  const routes = sql(`select hex(ZID) id, hex(ZPROJECTID) projectId, ZNAME name, ZSTARTPOINT startPoint, ZENDPOINT endPoint, ZNOTES notes from ZPROJECTSERVICEROUTE order by ZNAME`);
  const assignments = sql(`select hex(ZID) id, hex(ZPROJECTID) projectId, hex(ZROUTEID) routeId, hex(ZVEHICLEID) vehicleId, ZDIRECTIONRAWVALUE direction, ZPLANNEDDAYS plannedDays, ZSERVICESPERDAY serviceCount, ZPRICEPERSERVICE pricePerService, ZCLIENTPRICEPERSERVICE clientPricePerService, ZSERVICETIME serviceTime, ZPLANNEDDATESTEXT plannedDatesText from ZPROJECTVEHICLEASSIGNMENT order by ZCREATEDAT`);
  const expenses = sql(`select hex(ZID) id, hex(ZSUBCONTRACTORID) subcontractorId, hex(ZVEHICLEID) vehicleId, ZCATEGORYRAWVALUE category, ZAMOUNT amount, ZEXPENSEDATE expenseDate, ZNOTES notes from ZSUBCONTRACTOREXPENSE order by ZEXPENSEDATE`);
  const routePlans = sql(`select Z_PK pk, hex(ZSERVICEROUTEID) routeId from ZROUTEPLAN`);
  const routePlanRelationColumn = firstExistingColumn("ZROUTEWAYPOINT", ["Z6WAYPOINTS", "Z7WAYPOINTS", "Z8WAYPOINTS"]);
  const waypoints = sql(`select ${routePlanRelationColumn} routePlanPk, hex(ZID) id, ZORDER stopOrder, ZTITLE title, ZLATITUDE latitude, ZLONGITUDE longitude from ZROUTEWAYPOINT order by ${routePlanRelationColumn}, ZORDER`);

  const subcontractorIds = new Set(subcontractors.map((item) => item.id).filter(Boolean));
  const vehicleIds = new Set(vehicles.map((item) => item.id).filter(Boolean));
  const projectIds = new Set(projects.map((item) => item.id).filter(Boolean));
  const routeIds = new Set(routes.map((item) => item.id).filter(Boolean));
  const routeProjectById = new Map();
  const planRouteByPk = new Map(routePlans.map((plan) => [Number(plan.pk), plan.routeId]));
  const stopsByRouteId = new Map();

  for (const waypoint of waypoints) {
    const routeId = planRouteByPk.get(Number(waypoint.routePlanPk));
    if (!routeId || !routeIds.has(routeId)) continue;
    const items = stopsByRouteId.get(routeId) || [];
    items.push({
      id: waypoint.id,
      title: waypoint.title || "Durak",
      latitude: Number(waypoint.latitude) || 0,
      longitude: Number(waypoint.longitude) || 0,
      order: Number(waypoint.stopOrder) || 0
    });
    stopsByRouteId.set(routeId, items);
  }

  const cloudRoutes = routes
    .filter((item) => projectIds.has(item.projectId))
    .map((item) => {
      routeProjectById.set(item.id, item.projectId);
      return {
        id: item.id,
        projectId: item.projectId,
        name: item.name || "Güzergah",
        startPoint: item.startPoint || "-",
        endPoint: item.endPoint || "-",
        notes: item.notes || null,
        stops: (stopsByRouteId.get(item.id) || []).sort((a, b) => a.order - b.order)
      };
    });

  const cloudAssignments = [];
  for (const item of assignments) {
    if (!routeIds.has(item.routeId) || !vehicleIds.has(item.vehicleId)) continue;
    const projectId = projectIds.has(item.projectId) ? item.projectId : routeProjectById.get(item.routeId);
    if (!projectId) continue;
    const dates = plannedDates(item.plannedDatesText, item.serviceTime, item.plannedDays);
    for (const [index, key] of dates.entries()) {
      const date = dateFromKey(key);
      cloudAssignments.push({
        id: dates.length === 1 ? item.id : `${item.id}-${index + 1}`,
        projectId,
        routeId: item.routeId,
        vehicleId: item.vehicleId,
        serviceDate: key,
        serviceTime: timeOnDate(date, item.serviceTime),
        direction: direction(item.direction),
        serviceCount: Number(item.serviceCount) || 1,
        pricePerService: Number(item.pricePerService) || 0,
        clientPricePerService: Number(item.clientPricePerService ?? item.pricePerService) || 0,
        notes: null
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    subcontractors: subcontractors.map((item) => ({
      id: item.id,
      companyName: item.companyName || "Taşeron",
      authorizedPerson: item.authorizedPerson || "-",
      phone: item.phone || "+90",
      email: item.email || null,
      address: item.address || null,
      taxOffice: item.taxOffice || null,
      taxNumber: item.taxNumber ? String(item.taxNumber) : null,
      iban: item.iban || null,
      notes: item.notes || null,
      isActive: Number(item.isActive) !== 0,
      loginId: item.loginId || null,
      password: item.password || null
    })),
    vehicles: vehicles.map((item) => ({
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
    })),
    projects: projects.map((item) => ({
      id: item.id,
      name: item.name || "Proje",
      clientCompany: item.clientCompany || "-",
      personnelCount: Number(item.personnelCount) || 0,
      status: status(item.status)
    })),
    routes: cloudRoutes,
    assignments: cloudAssignments,
    expenses: expenses
      .filter((item) => subcontractorIds.has(item.subcontractorId))
      .map((item) => ({
        id: item.id,
        subcontractorId: item.subcontractorId,
        vehicleId: vehicleIds.has(item.vehicleId) ? item.vehicleId : null,
        category: expenseCategory(item.category),
        expenseDate: dateFromAppleSeconds(item.expenseDate).toISOString(),
        amount: Number(item.amount) || 0,
        notes: item.notes || null
      }))
  };
}

async function main() {
  const snapshot = makeSnapshot();
  if (process.env.TRANSITOS_DRY_RUN === "1") {
    console.log(`TransitOS yerel veri paketi hazır: ${snapshot.subcontractors.length} taşeron, ${snapshot.vehicles.length} araç, ${snapshot.projects.length} proje, ${snapshot.routes.length} güzergah, ${snapshot.assignments.length} servis, ${snapshot.expenses.length} gider.`);
    return;
  }

  if (!password) {
    throw new Error("ADMIN_PASSWORD ortam değişkeni gerekli. Vercel'de kullandığınız yönetici şifresini burada verin.");
  }

  const authResponse = await fetch(`${cloudURL}/api/macos/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "MANAGER", loginId, password })
  });

  if (!authResponse.ok) {
    throw new Error(`Bulut girişi başarısız: ${authResponse.status} ${await authResponse.text()}`);
  }

  const { token } = await authResponse.json();
  const uploadResponse = await fetch(`${cloudURL}/api/macos/snapshot?replace=local`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(snapshot)
  });

  if (!uploadResponse.ok) {
    throw new Error(`Bulut aktarımı başarısız: ${uploadResponse.status} ${await uploadResponse.text()}`);
  }

  console.log(`TransitOS yerel verileri buluta aktarıldı: ${snapshot.subcontractors.length} taşeron, ${snapshot.vehicles.length} araç, ${snapshot.projects.length} proje, ${snapshot.routes.length} güzergah, ${snapshot.assignments.length} servis, ${snapshot.expenses.length} gider.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
