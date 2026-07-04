export type UserRole = "MANAGER" | "SERVICE_SUPERVISOR" | "SUBCONTRACTOR" | "PROJECT_OWNER";

export type DashboardSummary = {
  subcontractors: number;
  vehicles: number;
  activeProjects: number;
  todayServices: number;
  grossEarnings: number;
  expenses: number;
  netEarnings: number;
};

export type SessionUser = {
  id: string;
  displayName: string;
  role: UserRole;
  subcontractorId?: string;
  projectIds?: string[];
};
