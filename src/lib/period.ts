export type PeriodSearchParams = {
  month?: string;
  range?: string;
};

export type PeriodRange = 1 | 3 | 6 | 12;

export function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function parsePeriod(searchParams?: PeriodSearchParams | null) {
  const month = validMonth(searchParams?.month) ? searchParams!.month! : currentMonthKey();
  const range = parseRange(searchParams?.range);
  const [year, monthIndex] = month.split("-").map(Number);
  const endDate = new Date(year, monthIndex, 0, 23, 59, 59, 999);
  const startDate = new Date(year, monthIndex - range, 1, 0, 0, 0, 0);
  const monthTitle = startDate.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  const endTitle = endDate.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  const label = range === 1 ? endTitle : `${monthTitle} - ${endTitle}`;

  return {
    month,
    range,
    startDate,
    endDate,
    label,
    rangeLabel: range === 1 ? "Aylık" : range === 3 ? "3 Aylık" : range === 6 ? "6 Aylık" : "1 Yıllık"
  };
}

export function periodDateWhere(period: ReturnType<typeof parsePeriod>) {
  return { gte: period.startDate, lte: period.endDate };
}

function validMonth(value?: string) {
  return Boolean(value && /^\d{4}-\d{2}$/.test(value));
}

function parseRange(value?: string): PeriodRange {
  if (value === "3") return 3;
  if (value === "6") return 6;
  if (value === "12") return 12;
  return 1;
}
