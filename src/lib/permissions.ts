import { SessionUser, UserRole } from "@/types/domain";

export const roleLabels: Record<UserRole, string> = {
  MANAGER: "Yönetici",
  SERVICE_SUPERVISOR: "Servis Sorumlusu",
  SUBCONTRACTOR: "Taşeron",
  PROJECT_OWNER: "Proje Sahibi"
};

export function roleTitle(role?: UserRole | null) {
  return role ? roleLabels[role] : "Yönetici";
}

export function isManager(user?: SessionUser | null) {
  return user?.role === "MANAGER";
}

export function isServiceSupervisor(user?: SessionUser | null) {
  return user?.role === "SERVICE_SUPERVISOR";
}

export function isSubcontractor(user?: SessionUser | null) {
  return user?.role === "SUBCONTRACTOR" && Boolean(user.subcontractorId);
}

export function isProjectOwner(user?: SessionUser | null) {
  return user?.role === "PROJECT_OWNER";
}

export function canEditOperations(user?: SessionUser | null) {
  return isManager(user) || isServiceSupervisor(user);
}

export function canManageUsers(user?: SessionUser | null) {
  return isManager(user);
}

export function canManageSubcontractors(user?: SessionUser | null) {
  return isManager(user) || isServiceSupervisor(user);
}

export function canSeeSubcontractorMoney(user?: SessionUser | null) {
  return isManager(user) || isServiceSupervisor(user);
}

export function projectAccessWhere(user?: SessionUser | null) {
  if (!user || isManager(user)) return {};
  if (isServiceSupervisor(user)) return { serviceUsers: { some: { id: user.id } } };
  if (isProjectOwner(user)) return { ownerUsers: { some: { id: user.id } } };
  if (isSubcontractor(user)) {
    return { assignments: { some: { vehicle: { subcontractorId: user.subcontractorId } } } };
  }
  return { id: "__no_access__" };
}

export function routeAccessWhere(user?: SessionUser | null) {
  if (!user || isManager(user)) return {};
  if (isServiceSupervisor(user)) return { project: { serviceUsers: { some: { id: user.id } } } };
  if (isProjectOwner(user)) return { project: { ownerUsers: { some: { id: user.id } } } };
  if (isSubcontractor(user)) return { assignments: { some: { vehicle: { subcontractorId: user.subcontractorId } } } };
  return { id: "__no_access__" };
}

export function assignmentAccessWhere(user?: SessionUser | null) {
  if (!user || isManager(user)) return {};
  if (isServiceSupervisor(user)) return { project: { serviceUsers: { some: { id: user.id } } } };
  if (isProjectOwner(user)) return { project: { ownerUsers: { some: { id: user.id } } } };
  if (isSubcontractor(user)) return { vehicle: { subcontractorId: user.subcontractorId } };
  return { id: "__no_access__" };
}

export function vehicleAccessWhere(user?: SessionUser | null) {
  if (!user || isManager(user) || isServiceSupervisor(user)) return {};
  if (isProjectOwner(user)) {
    return { assignments: { some: { project: { ownerUsers: { some: { id: user.id } } } } } };
  }
  if (isSubcontractor(user)) return { subcontractorId: user.subcontractorId };
  return { id: "__no_access__" };
}
