import { prisma } from "@/lib/db";

const ISTANBUL_TIME_ZONE = "Europe/Istanbul";

export type DailyVisitPoint = {
  date: string;
  label: string;
  visitors: number;
};

export type VisitorAnalytics = {
  points: DailyVisitPoint[];
  today: number;
  last7Days: number;
  last30Days: number;
  peak: number;
};

export function istanbulDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ISTANBUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function dateFromKey(key: string) {
  return new Date(`${key}T00:00:00.000Z`);
}

export async function recordDailyVisitor() {
  const key = istanbulDateKey();
  const day = dateFromKey(key);

  await prisma.siteDailyVisit.upsert({
    where: { day },
    create: { day, visitors: 1 },
    update: { visitors: { increment: 1 } }
  });

  return key;
}

export async function readVisitorAnalytics(dayCount = 30): Promise<VisitorAnalytics> {
  const safeDayCount = Math.min(Math.max(dayCount, 7), 90);
  const todayKey = istanbulDateKey();
  const today = dateFromKey(todayKey);
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - (safeDayCount - 1));

  const rows = await prisma.siteDailyVisit.findMany({
    where: { day: { gte: start, lte: today } },
    orderBy: { day: "asc" },
    select: { day: true, visitors: true }
  });
  const values = new Map(rows.map((row) => [row.day.toISOString().slice(0, 10), row.visitors]));
  const labelFormatter = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "UTC" });
  const points = Array.from({ length: safeDayCount }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    return { date: key, label: labelFormatter.format(date), visitors: values.get(key) ?? 0 };
  });
  const sum = (items: DailyVisitPoint[]) => items.reduce((total, point) => total + point.visitors, 0);

  return {
    points,
    today: points.at(-1)?.visitors ?? 0,
    last7Days: sum(points.slice(-7)),
    last30Days: sum(points),
    peak: Math.max(0, ...points.map((point) => point.visitors))
  };
}
