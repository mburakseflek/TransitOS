export function mapToEquivalentWeekday(sourceDate: Date, targetYear: number, targetMonthIndex: number) {
  const weekday = sourceDate.getDay();
  const occurrence = Math.floor((sourceDate.getDate() - 1) / 7);
  const firstDay = new Date(targetYear, targetMonthIndex, 1, 12, 0, 0, 0);
  const offset = (weekday - firstDay.getDay() + 7) % 7;
  const targetDay = 1 + offset + occurrence * 7;
  const lastDay = new Date(targetYear, targetMonthIndex + 1, 0).getDate();
  return targetDay <= lastDay ? new Date(targetYear, targetMonthIndex, targetDay, 12, 0, 0, 0) : null;
}
