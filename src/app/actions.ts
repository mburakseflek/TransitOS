"use server";

import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ExpenseCategory, FinancialDocumentLineKind, FinancialDocumentType, Prisma, RecordStatus, ServiceDirection, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatPhoneTR, monthKey, normalizePhoneDigitsTR, parseTurkishMoney } from "@/lib/format";
import { readSessionToken } from "@/lib/auth";
import { expenseCategoryTitle, serviceDirectionTitle } from "@/lib/labels";
import { canEditOperations, canManageSubcontractors, canManageUsers, isManager, isServiceSupervisor } from "@/lib/permissions";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function numberValue(formData: FormData, key: string) {
  return Number(String(formData.get(key) ?? "0").replace(",", ".")) || 0;
}

function moneyValue(formData: FormData, key: string) {
  return parseTurkishMoney(formData.get(key));
}

function ratingValue(formData: FormData, key: string) {
  const value = Math.round(numberValue(formData, key));
  return Number.isFinite(value) ? Math.min(5, Math.max(1, value)) : 0;
}

function hasValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim().length > 0;
}

function ids(formData: FormData, key: string) {
  return formData.getAll(key).map(String).filter(Boolean);
}

function optional(formData: FormData, key: string) {
  const value = text(formData, key);
  return value.length ? value : null;
}

function optionalId(formData: FormData, key: string) {
  const value = optional(formData, key);
  return value && value !== "none" ? value : null;
}

function returnTo(formData: FormData, fallback: string) {
  const value = text(formData, "_returnTo");
  return (value.startsWith("/") && !value.startsWith("//") ? value : fallback) as any;
}

function dateValue(formData: FormData, key: string) {
  const value = text(formData, key);
  return value ? new Date(`${value}T12:00:00`) : new Date();
}

function dateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function surveyReturnPath(vehicleId: string, status: string) {
  return `/anket/arac/${encodeURIComponent(vehicleId)}?sent=${encodeURIComponent(status)}`;
}

function redirectSurvey(vehicleId: string, status: string): never {
  redirect(surveyReturnPath(vehicleId, status) as never);
}

function periodFromMonthKey(value: string) {
  const safeValue = /^\d{4}-\d{2}$/.test(value) ? value : monthKey();
  const [year, month] = safeValue.split("-").map(Number);
  return {
    monthKey: safeValue,
    startDate: new Date(year, month - 1, 1, 0, 0, 0, 0),
    endDate: new Date(year, month, 0, 23, 59, 59, 999)
  };
}

function timeValue(date: Date, time: string) {
  const [hour = "0", minute = "0"] = time.split(":");
  const next = new Date(date);
  next.setHours(Number(hour), Number(minute), 0, 0);
  return next;
}

function endOfToday() {
  const value = new Date();
  value.setHours(23, 59, 59, 999);
  return value;
}

function recordStatus(formData: FormData, key: string, fallback: RecordStatus) {
  const value = text(formData, key);
  return Object.values(RecordStatus).includes(value as RecordStatus) ? (value as RecordStatus) : fallback;
}

function serviceDirection(formData: FormData) {
  const value = text(formData, "direction");
  return Object.values(ServiceDirection).includes(value as ServiceDirection) ? (value as ServiceDirection) : ServiceDirection.MORNING;
}

function userRole(formData: FormData) {
  const value = text(formData, "role");
  return Object.values(UserRole).includes(value as UserRole) ? (value as UserRole) : UserRole.SUBCONTRACTOR;
}

function expenseCategory(formData: FormData) {
  const value = text(formData, "category");
  return Object.values(ExpenseCategory).includes(value as ExpenseCategory) ? (value as ExpenseCategory) : ExpenseCategory.OTHER;
}

async function expenseVehicleId(subcontractorId: string, vehicleId: string | null) {
  if (!vehicleId) return null;
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, subcontractorId },
    select: { id: true }
  });
  return vehicle?.id ?? null;
}

async function currentSessionUser() {
  const sessionCookie = (await cookies()).get("transitos_session")?.value;
  return sessionCookie ? await readSessionToken(sessionCookie).catch(() => null) : null;
}

async function requireOperationsEditor() {
  const user = await currentSessionUser();
  if (!canEditOperations(user)) redirect("/transitos/dashboard");
  return user;
}

async function requireSubcontractorManager() {
  const user = await currentSessionUser();
  if (!canManageSubcontractors(user)) redirect("/transitos/dashboard");
  return user;
}

async function requireUserManager() {
  const user = await currentSessionUser();
  if (!canManageUsers(user)) redirect("/transitos/dashboard");
  return user;
}

function persistedUserId(user: Awaited<ReturnType<typeof currentSessionUser>>) {
  return user?.id && user.id !== "admin" ? user.id : undefined;
}

export async function createSubcontractor(formData: FormData) {
  await requireSubcontractorManager();
  const loginId = text(formData, "loginId");
  const password = text(formData, "password") || "1234";
  const subcontractor = await prisma.subcontractor.create({
    data: {
      companyName: text(formData, "companyName"),
      authorizedPerson: text(formData, "authorizedPerson"),
      phone: formatPhoneTR(text(formData, "phone")),
      email: optional(formData, "email"),
      taxOffice: optional(formData, "taxOffice"),
      taxNumber: optional(formData, "taxNumber"),
      iban: optional(formData, "iban"),
      address: optional(formData, "address"),
      notes: optional(formData, "notes"),
      status: text(formData, "status") === "PASSIVE" ? RecordStatus.PASSIVE : RecordStatus.ACTIVE
    }
  });

  if (loginId) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
      where: { loginId },
      create: {
        loginId,
        passwordHash,
        displayName: subcontractor.companyName,
        role: "SUBCONTRACTOR",
        subcontractorId: subcontractor.id
      },
      update: {
        passwordHash,
        displayName: subcontractor.companyName,
        role: "SUBCONTRACTOR",
        subcontractorId: subcontractor.id,
        serviceProjects: { set: [] },
        ownerProjects: { set: [] }
      }
    });
  }
  redirect(returnTo(formData, "/transitos/subcontractors"));
}

export async function updateSubcontractor(formData: FormData) {
  await requireSubcontractorManager();
  const id = text(formData, "id");
  const loginId = text(formData, "loginId");
  const password = text(formData, "password");
  const subcontractor = await prisma.subcontractor.update({
    where: { id },
    data: {
      companyName: text(formData, "companyName"),
      authorizedPerson: text(formData, "authorizedPerson"),
      phone: formatPhoneTR(text(formData, "phone")),
      email: optional(formData, "email"),
      taxOffice: optional(formData, "taxOffice"),
      taxNumber: optional(formData, "taxNumber"),
      iban: optional(formData, "iban"),
      address: optional(formData, "address"),
      notes: optional(formData, "notes"),
      status: text(formData, "status") === "PASSIVE" ? RecordStatus.PASSIVE : RecordStatus.ACTIVE
    }
  });

  if (loginId) {
    const existing = await prisma.user.findFirst({ where: { subcontractorId: id } });
    await prisma.user.upsert({
      where: { loginId: existing?.loginId ?? loginId },
      create: {
        loginId,
        passwordHash: await bcrypt.hash(password || "1234", 10),
        displayName: subcontractor.companyName,
        role: "SUBCONTRACTOR",
        subcontractorId: id
      },
      update: {
        loginId,
        displayName: subcontractor.companyName,
        ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {})
      }
    });
  }
  redirect(returnTo(formData, "/transitos/subcontractors"));
}

export async function createAccessUser(formData: FormData) {
  await requireUserManager();
  const role = userRole(formData);
  const projectIds = formData.getAll("projectIds").map(String).filter(Boolean);
  const companyIds = ids(formData, "companyIds");
  const loginId = text(formData, "loginId");
  const passwordHash = await bcrypt.hash(text(formData, "password") || "1234", 10);
  await prisma.user.upsert({
    where: { loginId },
    create: {
      loginId,
      passwordHash,
      displayName: text(formData, "displayName"),
      role,
      subcontractorId: role === UserRole.SUBCONTRACTOR ? optionalId(formData, "subcontractorId") : null,
      serviceProjects: role === UserRole.SERVICE_SUPERVISOR
        ? { connect: projectIds.map((id) => ({ id })) }
        : undefined,
      ownerProjects: undefined,
      ownerCompanies: role === UserRole.PROJECT_OWNER ? { connect: companyIds.map((id) => ({ id })) } : undefined
    },
    update: {
      passwordHash,
      displayName: text(formData, "displayName"),
      role,
      subcontractorId: role === UserRole.SUBCONTRACTOR ? optionalId(formData, "subcontractorId") : null,
      serviceProjects: { set: role === UserRole.SERVICE_SUPERVISOR ? projectIds.map((id) => ({ id })) : [] },
      ownerProjects: { set: [] },
      ownerCompanies: { set: role === UserRole.PROJECT_OWNER ? companyIds.map((id) => ({ id })) : [] }
    }
  });
  redirect(returnTo(formData, "/transitos/settings"));
}

export async function updateAccessUser(formData: FormData) {
  await requireUserManager();
  const role = userRole(formData);
  const projectIds = formData.getAll("projectIds").map(String).filter(Boolean);
  const companyIds = ids(formData, "companyIds");
  const password = text(formData, "password");
  await prisma.user.update({
    where: { id: text(formData, "id") },
    data: {
      loginId: text(formData, "loginId"),
      ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
      displayName: text(formData, "displayName"),
      role,
      subcontractorId: role === UserRole.SUBCONTRACTOR ? optionalId(formData, "subcontractorId") : null,
      serviceProjects: { set: role === UserRole.SERVICE_SUPERVISOR ? projectIds.map((id) => ({ id })) : [] },
      ownerProjects: { set: [] },
      ownerCompanies: { set: role === UserRole.PROJECT_OWNER ? companyIds.map((id) => ({ id })) : [] }
    }
  });
  redirect(returnTo(formData, "/transitos/settings"));
}

export async function deleteAccessUser(formData: FormData) {
  await requireUserManager();
  await prisma.user.delete({ where: { id: text(formData, "id") } });
  redirect(returnTo(formData, "/transitos/settings"));
}

export async function deleteSubcontractor(formData: FormData) {
  await requireSubcontractorManager();
  const id = text(formData, "id");
  await prisma.user.deleteMany({ where: { subcontractorId: id } });
  await prisma.expense.deleteMany({ where: { subcontractorId: id } });
  const vehicles = await prisma.vehicle.findMany({ where: { subcontractorId: id }, select: { id: true } });
  const vehicleIds = vehicles.map((vehicle) => vehicle.id);
  await prisma.serviceAssignment.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
  await prisma.driverDocument.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
  await prisma.vehicle.deleteMany({ where: { subcontractorId: id } });
  await prisma.subcontractor.delete({ where: { id } });
  redirect(returnTo(formData, "/transitos/subcontractors"));
}

export async function createVehicle(formData: FormData) {
  await requireOperationsEditor();
  await prisma.vehicle.create({
    data: {
      subcontractorId: optional(formData, "subcontractorId"),
      fleetNumber: text(formData, "fleetNumber"),
      plateNumber: text(formData, "plateNumber"),
      make: optional(formData, "make"),
      model: optional(formData, "model"),
      modelYear: numberValue(formData, "modelYear") || null,
      capacity: numberValue(formData, "capacity"),
      status: recordStatus(formData, "status", RecordStatus.ACTIVE),
      driverName: optional(formData, "driverName"),
      driverPhone: formatPhoneTR(text(formData, "driverPhone"))
    }
  });
  redirect(returnTo(formData, "/transitos/vehicles"));
}

export async function updateVehicle(formData: FormData) {
  await requireOperationsEditor();
  const id = text(formData, "id");
  await prisma.vehicle.update({
    where: { id },
    data: {
      subcontractorId: optional(formData, "subcontractorId"),
      fleetNumber: text(formData, "fleetNumber"),
      plateNumber: text(formData, "plateNumber"),
      make: optional(formData, "make"),
      model: optional(formData, "model"),
      modelYear: numberValue(formData, "modelYear") || null,
      capacity: numberValue(formData, "capacity"),
      status: recordStatus(formData, "status", RecordStatus.ACTIVE),
      driverName: optional(formData, "driverName"),
      driverPhone: formatPhoneTR(text(formData, "driverPhone"))
    }
  });
  redirect(returnTo(formData, "/transitos/vehicles"));
}

export async function deleteVehicle(formData: FormData) {
  await requireOperationsEditor();
  const id = text(formData, "id");
  await prisma.serviceAssignment.deleteMany({ where: { vehicleId: id } });
  await prisma.expense.deleteMany({ where: { vehicleId: id } });
  await prisma.driverDocument.deleteMany({ where: { vehicleId: id } });
  await prisma.vehicle.delete({ where: { id } });
  redirect(returnTo(formData, "/transitos/vehicles"));
}

export async function createProject(formData: FormData) {
  await requireOperationsEditor();
  const company = await prisma.projectCompany.findUnique({ where: { id: text(formData, "projectCompanyId") } });
  if (!company) redirect(returnTo(formData, "/transitos/projects"));
  await prisma.project.create({
    data: {
      name: text(formData, "name"),
      clientCompany: company.name,
      projectCompanyId: company.id,
      personnelCount: numberValue(formData, "personnelCount"),
      status: recordStatus(formData, "status", RecordStatus.PLANNING)
    }
  });
  redirect(returnTo(formData, "/transitos/projects"));
}

export async function updateProject(formData: FormData) {
  await requireOperationsEditor();
  const company = await prisma.projectCompany.findUnique({ where: { id: text(formData, "projectCompanyId") } });
  if (!company) redirect(returnTo(formData, "/transitos/projects"));
  await prisma.project.update({
    where: { id: text(formData, "id") },
    data: {
      name: text(formData, "name"),
      clientCompany: company.name,
      projectCompanyId: company.id,
      personnelCount: numberValue(formData, "personnelCount"),
      status: recordStatus(formData, "status", RecordStatus.PLANNING)
    }
  });
  redirect(returnTo(formData, `/transitos/projects?project=${text(formData, "id")}`));
}

export async function createProjectCompany(formData: FormData) {
  await requireUserManager();
  const name = text(formData, "name");
  const loginId = text(formData, "loginId");
  const password = text(formData, "password");
  const displayName = text(formData, "displayName") || name;
  if (name && loginId && password) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.$transaction(async (tx) => {
      const company = await tx.projectCompany.create({ data: { name } });
      await tx.user.create({
        data: {
          loginId,
          passwordHash,
          displayName,
          role: UserRole.PROJECT_OWNER,
          ownerCompanies: { connect: { id: company.id } }
        }
      });
    });
  }
  redirect(returnTo(formData, "/transitos/projects"));
}

export async function updateProjectCompany(formData: FormData) {
  await requireUserManager();
  const id = text(formData, "id");
  const name = text(formData, "name");
  if (name) await prisma.$transaction([
    prisma.projectCompany.update({ where: { id }, data: { name } }),
    prisma.project.updateMany({ where: { projectCompanyId: id }, data: { clientCompany: name } })
  ]);
  redirect(returnTo(formData, "/transitos/projects"));
}

export async function deleteProjectCompany(formData: FormData) {
  await requireUserManager();
  const companyId = text(formData, "id");
  const company = await prisma.projectCompany.findUnique({
    where: { id: companyId },
    select: {
      _count: { select: { projects: true } },
      ownerUsers: { select: { id: true, _count: { select: { ownerCompanies: true } } } }
    }
  });
  if (company && company._count.projects === 0) {
    await prisma.$transaction(async (tx) => {
      for (const owner of company.ownerUsers) {
        if (owner._count.ownerCompanies <= 1) await tx.user.delete({ where: { id: owner.id } });
        else await tx.user.update({ where: { id: owner.id }, data: { ownerCompanies: { disconnect: { id: companyId } } } });
      }
      await tx.projectCompany.delete({ where: { id: companyId } });
    });
  }
  redirect(returnTo(formData, "/transitos/projects"));
}

export async function createProjectCompanyUser(formData: FormData) {
  await requireUserManager();
  const companyId = text(formData, "companyId");
  const loginId = text(formData, "loginId");
  const password = text(formData, "password");
  const displayName = text(formData, "displayName");
  if (companyId && loginId && password && displayName) {
    await prisma.user.create({
      data: {
        loginId,
        passwordHash: await bcrypt.hash(password, 10),
        displayName,
        role: UserRole.PROJECT_OWNER,
        ownerCompanies: { connect: { id: companyId } }
      }
    });
  }
  redirect(returnTo(formData, "/transitos/settings"));
}

export async function updateProjectCompanyUser(formData: FormData) {
  await requireUserManager();
  const id = text(formData, "id");
  const companyId = text(formData, "companyId");
  const password = text(formData, "password");
  const account = await prisma.user.findFirst({
    where: { id, role: UserRole.PROJECT_OWNER, ownerCompanies: { some: { id: companyId } } },
    select: { id: true }
  });
  if (account) {
    await prisma.user.update({
      where: { id },
      data: {
        loginId: text(formData, "loginId"),
        displayName: text(formData, "displayName"),
        role: UserRole.PROJECT_OWNER,
        ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {})
      }
    });
  }
  redirect(returnTo(formData, "/transitos/settings"));
}

export async function deleteProjectCompanyUser(formData: FormData) {
  await requireUserManager();
  const id = text(formData, "id");
  const companyId = text(formData, "companyId");
  const account = await prisma.user.findFirst({
    where: { id, role: UserRole.PROJECT_OWNER, ownerCompanies: { some: { id: companyId } } },
    select: { id: true, _count: { select: { ownerCompanies: true } } }
  });
  if (account) {
    if (account._count.ownerCompanies <= 1) await prisma.user.delete({ where: { id } });
    else await prisma.user.update({ where: { id }, data: { ownerCompanies: { disconnect: { id: companyId } } } });
  }
  redirect(returnTo(formData, "/transitos/settings"));
}

export async function deleteProject(formData: FormData) {
  await requireOperationsEditor();
  await prisma.project.delete({ where: { id: text(formData, "id") } });
  redirect(returnTo(formData, "/transitos/projects"));
}

export async function createRoute(formData: FormData) {
  await requireOperationsEditor();
  const route = await prisma.serviceRoute.create({
    data: {
      projectId: optionalId(formData, "projectId"),
      name: text(formData, "name"),
      startPoint: text(formData, "startPoint"),
      endPoint: text(formData, "endPoint"),
      averageKilometers: 0,
      mapDistanceKm: 0,
      standardWorkDays: 0,
      defaultCarrierPricePerService: 0,
      defaultClientPricePerService: moneyValue(formData, "defaultClientPricePerService")
    }
  });
  redirect(returnTo(formData, `/transitos/projects?project=${optionalId(formData, "projectId") ?? ""}&route=${route.id}`));
}

export async function updateRoute(formData: FormData) {
  await requireOperationsEditor();
  const routeId = text(formData, "id");
  await prisma.serviceRoute.update({
    where: { id: routeId },
    data: {
      name: text(formData, "name"),
      startPoint: text(formData, "startPoint"),
      endPoint: text(formData, "endPoint"),
      averageKilometers: 0,
      mapDistanceKm: 0,
      standardWorkDays: 0,
      defaultClientPricePerService: moneyValue(formData, "defaultClientPricePerService")
    }
  });
  redirect(returnTo(formData, `/transitos/projects?route=${routeId}`));
}

export async function deleteRoute(formData: FormData) {
  await requireOperationsEditor();
  await prisma.serviceRoute.delete({ where: { id: text(formData, "id") } });
  redirect(returnTo(formData, "/transitos/projects"));
}

export async function createAssignment(formData: FormData) {
  await requireOperationsEditor();
  const serviceDate = dateValue(formData, "serviceDate");
  const routeId = text(formData, "routeId");
  const route = await prisma.serviceRoute.findUnique({
    where: { id: routeId },
    select: { projectId: true, defaultClientPricePerService: true }
  });
  await prisma.serviceAssignment.create({
    data: {
      seriesId: randomUUID(),
      projectId: optionalId(formData, "projectId") ?? route?.projectId ?? null,
      routeId,
      vehicleId: text(formData, "vehicleId"),
      serviceDate,
      serviceTime: timeValue(serviceDate, text(formData, "serviceTime") || "07:30"),
      direction: serviceDirection(formData),
      serviceCount: 1,
      kilometers: 0,
      pricePerService: moneyValue(formData, "pricePerService"),
      clientPricePerService: route?.defaultClientPricePerService ?? 0,
      monthKey: monthKey(serviceDate)
    }
  });
  redirect(returnTo(formData, `/transitos/projects?project=${optionalId(formData, "projectId") ?? ""}&route=${text(formData, "routeId")}`));
}

export async function updateAssignment(formData: FormData) {
  await requireOperationsEditor();
  const serviceDate = dateValue(formData, "serviceDate");
  const routeId = text(formData, "routeId");
  const route = await prisma.serviceRoute.findUnique({
    where: { id: routeId },
    select: { projectId: true, defaultClientPricePerService: true }
  });

  await prisma.serviceAssignment.update({
    where: { id: text(formData, "id") },
    data: {
      projectId: optionalId(formData, "projectId") ?? route?.projectId ?? null,
      routeId,
      vehicleId: text(formData, "vehicleId"),
      serviceDate,
      serviceTime: timeValue(serviceDate, text(formData, "serviceTime") || "07:30"),
      direction: serviceDirection(formData),
      serviceCount: 1,
      kilometers: 0,
      pricePerService: moneyValue(formData, "pricePerService"),
      clientPricePerService: route?.defaultClientPricePerService ?? 0,
      monthKey: monthKey(serviceDate)
    }
  });
  redirect(returnTo(formData, `/transitos/projects?project=${optionalId(formData, "projectId") ?? ""}&route=${routeId}`));
}

export async function createBulkAssignments(formData: FormData) {
  await requireOperationsEditor();
  const selectedDates = formData.getAll("serviceDates").map(String).filter(Boolean);
  const startDate = dateValue(formData, "startDate");
  const endDate = dateValue(formData, "endDate");
  const weekdays = new Set(formData.getAll("weekdays").map(String));
  const records = [];
  const seriesId = randomUUID();
  const dates = selectedDates.length ? selectedDates.map((value) => new Date(`${value}T12:00:00`)) : [];
  const routeId = text(formData, "routeId");
  const route = await prisma.serviceRoute.findUnique({
    where: { id: routeId },
    select: { projectId: true, defaultClientPricePerService: true }
  });

  if (!dates.length) {
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const mondayBasedWeekday = String(((cursor.getDay() + 6) % 7) + 1);
      if (weekdays.has(mondayBasedWeekday)) {
        dates.push(new Date(cursor));
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  for (const serviceDate of dates) {
      records.push({
        seriesId,
        projectId: optionalId(formData, "projectId") ?? route?.projectId ?? null,
        routeId,
        vehicleId: text(formData, "vehicleId"),
        serviceDate,
        serviceTime: timeValue(serviceDate, text(formData, "serviceTime") || "07:30"),
        direction: serviceDirection(formData),
        serviceCount: 1,
        kilometers: 0,
        pricePerService: moneyValue(formData, "pricePerService"),
        clientPricePerService: route?.defaultClientPricePerService ?? 0,
        monthKey: monthKey(serviceDate)
      });
  }

  if (records.length) {
    await prisma.serviceAssignment.createMany({ data: records });
  }
  redirect(returnTo(formData, `/transitos/projects?project=${text(formData, "projectId")}&route=${text(formData, "routeId")}`));
}

export async function updateAssignmentGroup(formData: FormData) {
  await requireOperationsEditor();
  const assignmentIds = ids(formData, "assignmentIds");
  const routeId = text(formData, "routeId");
  const fallbackUrl = `/transitos/projects?project=${optionalId(formData, "projectId") ?? ""}&route=${routeId}`;

  if (!assignmentIds.length || !routeId) {
    redirect(returnTo(formData, fallbackUrl));
  }

  const route = await prisma.serviceRoute.findUnique({
    where: { id: routeId },
    select: { projectId: true, defaultClientPricePerService: true }
  });
  const existingAssignments = await prisma.serviceAssignment.findMany({
    where: {
      id: { in: assignmentIds },
      routeId
    },
    orderBy: [{ serviceDate: "asc" }, { serviceTime: "asc" }]
  });

  if (!existingAssignments.length) {
    redirect(returnTo(formData, fallbackUrl));
  }

  const selectedDates = Array.from(new Set(formData.getAll("serviceDates").map(String).filter(Boolean))).sort();
  const fallbackDates = Array.from(new Set(existingAssignments.map((assignment) => dateKey(assignment.serviceDate)))).sort();
  const dateValues = selectedDates.length ? selectedDates : fallbackDates;
  const targetDateSet = new Set(dateValues);
  const existingByDate = new Map<string, typeof existingAssignments[number]>();
  const duplicateIds = new Set<string>();

  for (const assignment of existingAssignments) {
    const key = dateKey(assignment.serviceDate);
    if (existingByDate.has(key)) {
      duplicateIds.add(assignment.id);
    } else {
      existingByDate.set(key, assignment);
    }
  }

  const deleteIds = existingAssignments
    .filter((assignment) => !targetDateSet.has(dateKey(assignment.serviceDate)) || duplicateIds.has(assignment.id))
    .map((assignment) => assignment.id);
  const updates: Prisma.PrismaPromise<unknown>[] = [];
  const creates: Prisma.ServiceAssignmentCreateManyInput[] = [];
  const seriesId = existingAssignments.find((assignment) => assignment.seriesId)?.seriesId ?? randomUUID();
  const clientPricePerService = existingAssignments[0]?.clientPricePerService ?? route?.defaultClientPricePerService ?? 0;

  for (const value of dateValues) {
      const serviceDate = new Date(`${value}T12:00:00`);
      const current = existingByDate.get(value);
      const data = {
        seriesId,
        projectId: optionalId(formData, "projectId") ?? route?.projectId ?? null,
        routeId,
        vehicleId: text(formData, "vehicleId"),
        serviceDate,
        serviceTime: timeValue(serviceDate, text(formData, "serviceTime") || "07:30"),
        direction: serviceDirection(formData),
        serviceCount: 1,
        kilometers: 0,
        pricePerService: moneyValue(formData, "pricePerService"),
        clientPricePerService,
        monthKey: monthKey(serviceDate)
      };

      if (current && targetDateSet.has(value) && !duplicateIds.has(current.id)) {
        updates.push(prisma.serviceAssignment.update({
          where: { id: current.id },
          data
        }));
      } else {
        creates.push(data);
      }
  }

  await prisma.$transaction([
    ...(deleteIds.length ? [prisma.serviceAssignment.deleteMany({ where: { id: { in: deleteIds } } })] : []),
    ...updates,
    ...(creates.length ? [prisma.serviceAssignment.createMany({ data: creates })] : [])
  ]);
  redirect(returnTo(formData, fallbackUrl));
}

export async function deleteAssignmentGroup(formData: FormData) {
  await requireOperationsEditor();
  const assignmentIds = ids(formData, "assignmentIds");

  if (assignmentIds.length) {
    await prisma.serviceAssignment.deleteMany({
      where: { id: { in: assignmentIds } }
    });
  }
  redirect(returnTo(formData, "/transitos/projects"));
}

export async function createOneOffJob(formData: FormData) {
  await requireOperationsEditor();
  const serviceDate = dateValue(formData, "serviceDate");
  const route = await prisma.serviceRoute.create({
    data: {
      projectId: null,
      name: text(formData, "name") || "Tek seferlik iş",
      startPoint: text(formData, "startPoint"),
      endPoint: text(formData, "endPoint"),
      averageKilometers: 0,
      mapDistanceKm: 0,
      standardWorkDays: 0,
      defaultCarrierPricePerService: moneyValue(formData, "pricePerService"),
      defaultClientPricePerService: moneyValue(formData, "clientPricePerService")
    }
  });

  await prisma.serviceAssignment.create({
    data: {
      seriesId: randomUUID(),
      projectId: null,
      routeId: route.id,
      vehicleId: text(formData, "vehicleId"),
      serviceDate,
      serviceTime: timeValue(serviceDate, text(formData, "serviceTime") || "07:30"),
      direction: ServiceDirection.ONE_OFF,
      serviceCount: 1,
      kilometers: 0,
      pricePerService: moneyValue(formData, "pricePerService"),
      clientPricePerService: moneyValue(formData, "clientPricePerService"),
      monthKey: monthKey(serviceDate)
    }
  });
  redirect(returnTo(formData, "/transitos/projects"));
}

export async function updateOneOffJob(formData: FormData) {
  await requireOperationsEditor();
  const serviceDate = dateValue(formData, "serviceDate");
  const assignmentId = text(formData, "assignmentId");

  await prisma.serviceRoute.update({
    where: { id: text(formData, "routeId") },
    data: {
      projectId: null,
      name: text(formData, "name") || "Tek seferlik iş",
      startPoint: text(formData, "startPoint"),
      endPoint: text(formData, "endPoint"),
      averageKilometers: 0,
      mapDistanceKm: 0,
      standardWorkDays: 0,
      defaultCarrierPricePerService: moneyValue(formData, "pricePerService"),
      defaultClientPricePerService: moneyValue(formData, "clientPricePerService")
    }
  });

  if (assignmentId) {
    await prisma.serviceAssignment.update({
      where: { id: assignmentId },
      data: {
        projectId: null,
        vehicleId: text(formData, "vehicleId"),
        serviceDate,
        serviceTime: timeValue(serviceDate, text(formData, "serviceTime") || "07:30"),
        direction: ServiceDirection.ONE_OFF,
        serviceCount: 1,
        kilometers: 0,
        pricePerService: moneyValue(formData, "pricePerService"),
        clientPricePerService: moneyValue(formData, "clientPricePerService"),
        monthKey: monthKey(serviceDate)
      }
    });
  }
  redirect(returnTo(formData, "/transitos/projects"));
}

export async function deleteOneOffJob(formData: FormData) {
  await requireOperationsEditor();
  await prisma.serviceRoute.delete({ where: { id: text(formData, "routeId") } });
  redirect(returnTo(formData, "/transitos/projects"));
}

export async function deleteAssignment(formData: FormData) {
  await requireOperationsEditor();
  await prisma.serviceAssignment.delete({ where: { id: text(formData, "id") } });
  redirect(returnTo(formData, "/transitos/projects"));
}

export async function issueSubcontractorEarningDocument(formData: FormData) {
  const user = await currentSessionUser();
  if (!isManager(user) && !isServiceSupervisor(user)) {
    redirect("/transitos/earnings");
  }

  const subcontractorId = text(formData, "subcontractorId");
  const period = periodFromMonthKey(text(formData, "monthKey"));
  const completedUntil = new Date(Math.min(period.endDate.getTime(), endOfToday().getTime()));
  const selectedAssignmentIds = ids(formData, "assignmentIds");
  const selectedExpenseIds = ids(formData, "expenseIds");
  const manualServiceSelection = text(formData, "serviceSelectionMode") === "manual";
  const manualExpenseSelection = text(formData, "expenseSelectionMode") === "manual";

  const [subcontractor, assignments, expenses] = await Promise.all([
    prisma.subcontractor.findUnique({ where: { id: subcontractorId } }),
    prisma.serviceAssignment.findMany({
      where: {
        serviceDate: { gte: period.startDate, lte: completedUntil },
        vehicle: { subcontractorId },
        ...(manualServiceSelection ? { id: { in: selectedAssignmentIds.length ? selectedAssignmentIds : ["__none__"] } } : {})
      },
      include: { route: true, project: true, vehicle: true },
      orderBy: [{ serviceDate: "asc" }, { serviceTime: "asc" }]
    }),
    prisma.expense.findMany({
      where: {
        subcontractorId,
        expenseDate: { gte: period.startDate, lte: period.endDate },
        ...(manualExpenseSelection ? { id: { in: selectedExpenseIds.length ? selectedExpenseIds : ["__none__"] } } : {})
      },
      include: { vehicle: true },
      orderBy: { expenseDate: "asc" }
    })
  ]);

  if (!subcontractor) {
    redirect(returnTo(formData, "/transitos/finance"));
  }

  const grossAmount = assignments.reduce((sum, item) => sum + Number(item.pricePerService) * item.serviceCount, 0);
  const expenseAmount = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const netAmount = grossAmount - expenseAmount;

  await prisma.financialDocument.deleteMany({
    where: {
      type: FinancialDocumentType.SUBCONTRACTOR_EARNING,
      monthKey: period.monthKey,
      subcontractorId
    }
  });

  await prisma.financialDocument.create({
    data: {
      type: FinancialDocumentType.SUBCONTRACTOR_EARNING,
      monthKey: period.monthKey,
      periodStart: period.startDate,
      periodEnd: period.endDate,
      subcontractorId,
      createdByUserId: persistedUserId(user),
      grossAmount,
      expenseAmount,
      netAmount,
      notes: text(formData, "notes") || null,
      lines: {
        create: [
          ...assignments.map((item) => ({
            kind: FinancialDocumentLineKind.SERVICE,
            serviceAssignmentId: item.id,
            serviceDate: item.serviceDate,
            title: `${item.route.name} · ${serviceDirectionTitle(item.direction)}`,
            description: `${item.vehicle.fleetNumber} · ${item.vehicle.plateNumber}`,
            projectName: item.project?.name ?? "Tek seferlik iş",
            routeName: item.route.name,
            vehicleName: `${item.vehicle.fleetNumber} · ${item.vehicle.plateNumber}`,
            serviceType: serviceDirectionTitle(item.direction),
            serviceCount: item.serviceCount,
            unitPrice: Number(item.pricePerService),
            amount: Number(item.pricePerService) * item.serviceCount
          })),
          ...expenses.map((item) => ({
            kind: FinancialDocumentLineKind.EXPENSE,
            expenseId: item.id,
            serviceDate: item.expenseDate,
            title: expenseCategoryTitle(item.category),
            description: item.notes ?? null,
            vehicleName: item.vehicle ? `${item.vehicle.fleetNumber} · ${item.vehicle.plateNumber}` : "Genel",
            serviceCount: 0,
            unitPrice: Number(item.amount),
            amount: Number(item.amount)
          }))
        ]
      }
    }
  });
  redirect(returnTo(formData, `/transitos/finance?month=${period.monthKey}`));
}

export async function issueProjectInvoiceDocument(formData: FormData) {
  const user = await currentSessionUser();
  if (!isManager(user)) {
    redirect("/transitos/earnings");
  }

  const projectCompanyId = text(formData, "projectCompanyId");
  const period = periodFromMonthKey(text(formData, "monthKey"));
  const completedUntil = new Date(Math.min(period.endDate.getTime(), endOfToday().getTime()));
  const selectedAssignmentIds = ids(formData, "assignmentIds");
  const manualServiceSelection = text(formData, "serviceSelectionMode") === "manual";

  const [company, assignments] = await Promise.all([
    prisma.projectCompany.findUnique({ where: { id: projectCompanyId } }),
    prisma.serviceAssignment.findMany({
      where: {
        project: { projectCompanyId },
        serviceDate: { gte: period.startDate, lte: completedUntil },
        ...(manualServiceSelection ? { id: { in: selectedAssignmentIds.length ? selectedAssignmentIds : ["__none__"] } } : {})
      },
      include: { route: true, vehicle: true, project: true },
      orderBy: [{ serviceDate: "asc" }, { serviceTime: "asc" }]
    })
  ]);

  if (!company) {
    redirect(returnTo(formData, "/transitos/finance"));
  }

  const grossAmount = assignments.reduce((sum, item) => sum + Number(item.clientPricePerService) * item.serviceCount, 0);

  await prisma.financialDocument.deleteMany({
    where: {
      type: FinancialDocumentType.PROJECT_INVOICE,
      monthKey: period.monthKey,
      OR: [
        { projectCompanyId },
        { project: { projectCompanyId } }
      ]
    }
  });

  await prisma.financialDocument.create({
    data: {
      type: FinancialDocumentType.PROJECT_INVOICE,
      monthKey: period.monthKey,
      periodStart: period.startDate,
      periodEnd: period.endDate,
      projectCompanyId,
      createdByUserId: persistedUserId(user),
      grossAmount,
      expenseAmount: 0,
      netAmount: grossAmount,
      notes: text(formData, "notes") || null,
      lines: {
        create: assignments.map((item) => ({
          kind: FinancialDocumentLineKind.SERVICE,
          serviceAssignmentId: item.id,
          serviceDate: item.serviceDate,
          title: `${item.route.name} · ${serviceDirectionTitle(item.direction)}`,
          description: `${item.vehicle.fleetNumber} · ${item.vehicle.plateNumber}`,
          projectName: item.project?.name ?? "Proje",
          routeName: item.route.name,
          vehicleName: `${item.vehicle.fleetNumber} · ${item.vehicle.plateNumber}`,
          serviceType: serviceDirectionTitle(item.direction),
          serviceCount: item.serviceCount,
          unitPrice: Number(item.clientPricePerService),
          amount: Number(item.clientPricePerService) * item.serviceCount
        }))
      }
    }
  });
  redirect(returnTo(formData, `/transitos/finance?month=${period.monthKey}`));
}

export async function cancelSubcontractorEarningDocument(formData: FormData) {
  const user = await currentSessionUser();
  if (!isManager(user) && !isServiceSupervisor(user)) {
    redirect("/transitos/earnings");
  }

  await prisma.financialDocument.deleteMany({
    where: {
      id: text(formData, "documentId"),
      type: FinancialDocumentType.SUBCONTRACTOR_EARNING
    }
  });
  redirect(returnTo(formData, "/transitos/finance"));
}

export async function cancelProjectInvoiceDocument(formData: FormData) {
  const user = await currentSessionUser();
  if (!isManager(user)) {
    redirect("/transitos/earnings");
  }

  await prisma.financialDocument.deleteMany({
    where: {
      id: text(formData, "documentId"),
      type: FinancialDocumentType.PROJECT_INVOICE
    }
  });
  redirect(returnTo(formData, "/transitos/finance"));
}

export async function createExpense(formData: FormData) {
  await requireUserManager();
  const expenseDate = dateValue(formData, "expenseDate");
  const subcontractorId = text(formData, "subcontractorId");
  const vehicleId = await expenseVehicleId(subcontractorId, optionalId(formData, "vehicleId"));
  await prisma.expense.create({
    data: {
      subcontractorId,
      vehicleId,
      category: expenseCategory(formData),
      amount: moneyValue(formData, "amount"),
      expenseDate,
      monthKey: monthKey(expenseDate),
      notes: optional(formData, "notes")
    }
  });
  redirect(returnTo(formData, "/transitos/expenses"));
}

export async function updateExpense(formData: FormData) {
  await requireUserManager();
  const expenseDate = dateValue(formData, "expenseDate");
  const subcontractorId = text(formData, "subcontractorId");
  const vehicleId = await expenseVehicleId(subcontractorId, optionalId(formData, "vehicleId"));
  await prisma.expense.update({
    where: { id: text(formData, "id") },
    data: {
      subcontractorId,
      vehicleId,
      category: expenseCategory(formData),
      amount: moneyValue(formData, "amount"),
      expenseDate,
      monthKey: monthKey(expenseDate),
      notes: optional(formData, "notes")
    }
  });
  redirect(returnTo(formData, "/transitos/expenses"));
}

export async function deleteExpense(formData: FormData) {
  await requireUserManager();
  await prisma.expense.delete({ where: { id: text(formData, "id") } });
  redirect(returnTo(formData, "/transitos/expenses"));
}

export async function createDriverDocument(formData: FormData) {
  await requireOperationsEditor();
  const vehicleId = text(formData, "vehicleId");
  const fileUrl = text(formData, "fileUrl");
  if (!fileUrl) {
    redirect(returnTo(formData, "/transitos/drivers"));
  }
  await prisma.driverDocument.create({
    data: {
      vehicleId,
      title: text(formData, "title") || "Sürücü / araç evrakı",
      fileUrl
    }
  });
  redirect(returnTo(formData, "/transitos/drivers"));
}

export async function deleteDriverDocument(formData: FormData) {
  await requireOperationsEditor();
  await prisma.driverDocument.delete({ where: { id: text(formData, "id") } });
  redirect(returnTo(formData, "/transitos/drivers"));
}

export async function submitVehicleSurvey(formData: FormData) {
  const vehicleId = text(formData, "vehicleId");
  const routeId = optionalId(formData, "routeId");
  const deviceKey = text(formData, "deviceKey") || "unknown-device";
  const journeyDate = dateValue(formData, "journeyDate");
  const passengerName = text(formData, "passengerName");
  const passengerPhoneRaw = text(formData, "passengerPhone");
  const passengerPhone = formatPhoneTR(passengerPhoneRaw);
  const passengerPhoneDigits = normalizePhoneDigitsTR(passengerPhoneRaw);
  const passengerEmail = optional(formData, "passengerEmail");
  const favoriteTopics = formData.getAll("favoriteTopics").map(String).filter(Boolean);
  const ratings = {
    courtesyRating: ratingValue(formData, "courtesyRating"),
    safetyRating: ratingValue(formData, "safetyRating"),
    cleanlinessRating: ratingValue(formData, "cleanlinessRating"),
    comfortRating: ratingValue(formData, "comfortRating"),
    punctualityRating: ratingValue(formData, "punctualityRating"),
    trustRating: ratingValue(formData, "trustRating"),
    satisfactionRating: ratingValue(formData, "satisfactionRating"),
    recommendationRating: ratingValue(formData, "recommendationRating")
  };

  const ratingValues = Object.values(ratings);
  if (!vehicleId || !passengerName || passengerPhoneDigits.length !== 10 || ratingValues.some((value) => value < 1 || value > 5)) {
    redirectSurvey(vehicleId || "eksik", "missing");
  }

  const lowScoreExplanation = optional(formData, "lowScoreExplanation");
  if (ratingValues.some((value) => value <= 2) && !lowScoreExplanation) {
    redirectSurvey(vehicleId, "low-score");
  }

  const [vehicle, route] = await Promise.all([
    prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: {
        id: true,
        fleetNumber: true,
        plateNumber: true,
        driverName: true,
        driverPhone: true
      }
    }),
    routeId
      ? prisma.serviceRoute.findUnique({
          where: { id: routeId },
          include: { project: true }
        })
      : Promise.resolve(null)
  ]);

  if (!vehicle) {
    redirectSurvey(vehicleId, "not-found");
  }

  const averageRating = ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length;
  const serviceLineLabel = route
    ? `${route.project?.name ?? route.project?.clientCompany ?? "Tek seferlik iş"} - ${route.name}`
    : text(formData, "serviceLineLabel") || "Servis hattı seçilmedi";

  try {
    await prisma.vehicleSurveyResponse.create({
      data: {
        vehicleId,
        routeId: route?.id ?? null,
        projectId: route?.projectId ?? null,
        vehicleFleetNumber: vehicle.fleetNumber,
        vehiclePlateNumber: vehicle.plateNumber,
        driverName: vehicle.driverName,
        driverPhone: vehicle.driverPhone,
        passengerName,
        passengerPhone,
        passengerEmail,
        serviceLineLabel,
        journeyDate,
        deviceKey,
        ...ratings,
        favoriteTopics,
        comments: optional(formData, "comments"),
        lowScoreExplanation,
        averageRating
      }
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "P2002") {
      redirectSurvey(vehicleId, "already");
    }
    throw error;
  }
  redirectSurvey(vehicleId, "thanks");
}

export async function deleteVehicleSurveyResponse(formData: FormData) {
  await requireOperationsEditor();
  const user = await currentSessionUser();
  if (!isManager(user) && !isServiceSupervisor(user)) {
    redirect("/transitos/surveys" as never);
  }

  await prisma.vehicleSurveyResponse.delete({
    where: { id: text(formData, "id") }
  });
  redirect(returnTo(formData, "/transitos/surveys"));
}

export async function createStop(formData: FormData) {
  await requireOperationsEditor();
  await prisma.routeStop.create({
    data: {
      routeId: text(formData, "routeId"),
      title: text(formData, "title"),
      latitude: numberValue(formData, "latitude"),
      longitude: numberValue(formData, "longitude"),
      order: numberValue(formData, "order")
    }
  });
  redirect(returnTo(formData, "/transitos/projects"));
}

export async function deleteStop(formData: FormData) {
  await requireOperationsEditor();
  await prisma.routeStop.delete({ where: { id: text(formData, "id") } });
  redirect(returnTo(formData, "/transitos/projects"));
}
