import { DashboardSummary } from "@/types/domain";

export const emptyDashboard: DashboardSummary = {
  subcontractors: 0,
  vehicles: 0,
  activeProjects: 0,
  todayServices: 0,
  grossEarnings: 0,
  expenses: 0,
  netEarnings: 0
};

export const todayServices = [
  {
    time: "07:30",
    route: "Henüz servis planı yok",
    vehicle: "-",
    driver: "-",
    status: "Plan bekliyor"
  }
];
