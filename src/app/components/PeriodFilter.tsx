import { parsePeriod, type PeriodSearchParams } from "@/lib/period";

const rangeOptions = [
  { value: "1", label: "1 Ay" },
  { value: "3", label: "3 Ay" },
  { value: "6", label: "6 Ay" },
  { value: "12", label: "1 Yıl" }
];

export function PeriodFilter({
  searchParams,
  hidden = {},
  monthlyOnly = false
}: {
  searchParams?: PeriodSearchParams | null;
  hidden?: Record<string, string | undefined | null>;
  monthlyOnly?: boolean;
}) {
  const period = parsePeriod(searchParams);
  const hiddenEntries = Object.entries(hidden).filter(([, value]) => Boolean(value));

  return (
    <form className="period-filter" method="get">
      {hiddenEntries.map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value ?? ""} />
      ))}
      <div className="period-picker-field">
        <label htmlFor="native-period-month">Dönem</label>
        <input id="native-period-month" name="month" type="month" defaultValue={period.month} required />
      </div>
      {monthlyOnly ? <input type="hidden" name="range" value="1" /> : (
        <label className="period-native-range">
          <span>Kapsam</span>
          <select name="range" defaultValue={String(period.range)}>
            {rangeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      )}
      <button className="primary compact-button period-submit-button" type="submit">
        Dönemi uygula
      </button>
    </form>
  );
}
