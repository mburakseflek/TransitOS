import { formatTRY } from "@/lib/format";
import { expenseCategoryTitle, serviceDirectionTitle } from "@/lib/labels";

type ServiceLine = {
  id: string;
  serviceDate?: Date | null;
  projectName?: string | null;
  routeName?: string | null;
  vehicleName?: string | null;
  serviceType?: string | null;
  serviceCount: number;
  unitPrice: unknown;
  amount: unknown;
  title?: string | null;
};

type ExpenseLine = {
  id: string;
  serviceDate?: Date | null;
  ownerName?: string | null;
  vehicleName?: string | null;
  title: string;
  description?: string | null;
  amount: unknown;
};

export function FinancialDocumentReport({
  document,
  title,
  owner,
  targetId
}: {
  document: any;
  title: string;
  owner: string;
  targetId: string;
}) {
  const serviceLines = document.lines.filter((line: any) => line.kind === "SERVICE");
  const expenseLines = document.lines.filter((line: any) => line.kind === "EXPENSE");
  const groupByVehicle = document.type === "SUBCONTRACTOR_EARNING";
  const services = serviceLines.reduce((sum: number, line: ServiceLine) => sum + line.serviceCount, 0);

  return (
    <div className="invoice-paper section transitos-report" id={targetId}>
      <div className="report-page">
        <ReportHeader
          title={title}
          subtitle={`${owner} · ${document.monthKey}`}
          documentNo={`Belge No: ${String(document.id).slice(-8).toUpperCase()}`}
          dateText={document.issuedAt.toLocaleDateString("tr-TR")}
        />
        <h2 className="report-owner">{owner}</h2>
        <div className="report-metrics">
          <Metric label="Servis" value={services.toLocaleString("tr-TR")} />
          <Metric label="Brüt" value={formatTRY(Number(document.grossAmount))} tone="blue" />
          {Number(document.expenseAmount) > 0 ? <Metric label="Gider" value={formatTRY(Number(document.expenseAmount))} tone="orange" /> : null}
          <Metric label="Net" value={formatTRY(Number(document.netAmount))} tone="green" />
        </div>
        <h2>{groupByVehicle ? "Araç Bazlı Hakediş Detayları" : "Güzergah Bazlı Fatura Detayları"}</h2>
        <ServiceLegend />
        <ServiceGroupList lines={serviceLines} monthKey={document.monthKey} groupByVehicle={groupByVehicle} />
        {expenseLines.length ? (
          <>
            <h2>Gider Kesintileri</h2>
            <ExpenseCardList expenses={expenseLines} />
          </>
        ) : null}
        <ReportFooter />
      </div>
    </div>
  );
}

export function MonthlyServiceReviewCards({
  assignments,
  mode,
  monthKey
}: {
  assignments: any[];
  mode: "client" | "carrier";
  monthKey: string;
}) {
  const lines = assignments.map((item) => {
    const unit = Number(mode === "client" ? item.clientPricePerService : item.pricePerService);
    return {
      id: item.id,
      serviceDate: item.serviceDate,
      projectName: item.project?.name ?? item.route?.project?.name ?? "Tek seferlik iş",
      routeName: item.route.name,
      vehicleName: `${item.vehicle.fleetNumber} · ${item.vehicle.plateNumber}`,
      serviceType: serviceDirectionTitle(item.direction),
      serviceCount: item.serviceCount,
      unitPrice: unit,
      amount: unit * item.serviceCount,
      title: item.route.name
    };
  });
  const total = lines.reduce((sum, line) => sum + Number(line.amount), 0);

  return (
    <div className="review-document">
      <div className="form-section-title">
        <strong>Bu Ay Kesilecek Servisler</strong>
        <small>{lines.length} servis · toplam {formatTRY(total)}</small>
      </div>
      <ServiceLegend />
      <ServiceGroupList lines={lines} monthKey={monthKey} groupByVehicle={mode === "carrier"} />
    </div>
  );
}

export function UnsignedServiceReport({
  assignments,
  monthKey,
  targetId,
  owner,
  documentLabel = "Hakediş belgesi"
}: {
  assignments: any[];
  monthKey: string;
  targetId: string;
  owner: string;
  documentLabel?: string;
}) {
  const lines = assignments.map((item) => ({
    id: item.id,
    serviceDate: item.serviceDate,
    projectName: item.project?.name ?? item.route?.project?.name ?? "Tek seferlik iş",
    routeName: item.route.name,
    vehicleName: `${item.vehicle.fleetNumber} · ${item.vehicle.plateNumber}`,
    serviceType: serviceDirectionTitle(item.direction),
    serviceCount: item.serviceCount,
    unitPrice: 0,
    amount: 0,
    title: item.route.name
  }));
  const services = lines.reduce((sum, line) => sum + line.serviceCount, 0);
  const vehicles = new Set(lines.map((line) => line.vehicleName)).size;
  const routes = new Set(lines.map((line) => line.routeName)).size;

  return (
    <div className="invoice-paper section transitos-report unsigned-service-report" id={targetId}>
      <div className="report-page">
        <ReportHeader
          title="Servis Özeti"
          subtitle={`${owner} · ${monthKey}`}
          documentNo={`${documentLabel} henüz kesilmedi`}
          dateText={new Date().toLocaleDateString("tr-TR")}
        />
        <h2 className="report-owner">{owner}</h2>
        <div className="report-metrics">
          <Metric label="Servis" value={services.toLocaleString("tr-TR")} />
          <Metric label="Araç" value={vehicles.toLocaleString("tr-TR")} tone="blue" />
          <Metric label="Güzergah" value={routes.toLocaleString("tr-TR")} tone="green" />
          <Metric label="Ücret" value="Kesim sonrası" tone="orange" />
        </div>
        <p className="report-notice">
          Bu dönem {documentLabel.toLocaleLowerCase("tr-TR")} henüz oluşturulmadı. Bu görünüm yalnızca taşınan ve planlanan servislerin operasyon özetidir; ücretlendirme belge kesimi yapıldıktan sonra görüntülenir.
        </p>
        <h2>Servis Kayıtları</h2>
        <ServiceLegend />
        <ServiceGroupList lines={lines} monthKey={monthKey} groupByVehicle showMoney={false} />
        <ReportFooter />
      </div>
    </div>
  );
}

export function MonthlyExpenseReviewCards({ expenses }: { expenses: any[] }) {
  const lines = expenses.map((item) => ({
    id: item.id,
    serviceDate: item.expenseDate,
    ownerName: item.subcontractor?.companyName ?? null,
    vehicleName: item.vehicle ? `${item.vehicle.fleetNumber} · ${item.vehicle.plateNumber}` : "Genel",
    title: expenseCategoryTitle(item.category),
    description: item.notes ?? null,
    amount: Number(item.amount)
  }));
  const total = lines.reduce((sum, line) => sum + Number(line.amount), 0);
  return (
    <div className="review-document">
      <div className="form-section-title">
        <strong>Gider Kesintileri</strong>
        <small>{lines.length} gider · toplam {formatTRY(total)}</small>
      </div>
      <ExpenseCardList expenses={lines} />
    </div>
  );
}

export function ExpenseReport({
  expenses,
  periodLabel,
  targetId
}: {
  expenses: any[];
  periodLabel: string;
  targetId: string;
}) {
  const lines = expenses.map((item) => ({
    id: item.id,
    serviceDate: item.expenseDate,
    ownerName: item.subcontractor?.companyName ?? "Taşeron",
    vehicleName: item.vehicle ? `${item.vehicle.fleetNumber} · ${item.vehicle.plateNumber}` : "Genel",
    title: expenseCategoryTitle(item.category),
    description: item.notes ?? null,
    amount: Number(item.amount)
  }));
  const total = lines.reduce((sum, line) => sum + Number(line.amount), 0);
  const ownerCount = new Set(lines.map((line) => line.ownerName).filter(Boolean)).size;
  const vehicleCount = lines.filter((line) => line.vehicleName && line.vehicleName !== "Genel").length;

  return (
    <div className="invoice-paper section transitos-report" id={targetId}>
      <div className="report-page">
        <ReportHeader
          title="Gider Raporu"
          subtitle={`${periodLabel} · Avans, yakıt, sigorta, ceza ve diğer kesinti kalemleri`}
          documentNo={`Rapor Tarihi: ${new Date().toLocaleDateString("tr-TR")}`}
          dateText="Seflek Turizm"
        />
        <h2 className="report-owner">Taşıyıcı Gider ve Kesinti Özeti</h2>
        <div className="report-metrics">
          <Metric label="Toplam Gider" value={formatTRY(total)} tone="orange" />
          <Metric label="Kayıt" value={String(lines.length)} />
          <Metric label="Taşeron" value={String(ownerCount)} tone="blue" />
          <Metric label="Araç Bağlı" value={String(vehicleCount)} tone="green" />
        </div>
        <h2>Gider Detayı</h2>
        <ExpenseCardList expenses={lines} />
        <ReportFooter />
      </div>
    </div>
  );
}

function ReportHeader({
  title,
  subtitle,
  documentNo,
  dateText
}: {
  title: string;
  subtitle: string;
  documentNo: string;
  dateText: string;
}) {
  return (
    <header className="report-top">
      <div>
        <h1>SEFLEKTUR Transit<span>OS</span></h1>
        <p>{title}</p>
        <small>{subtitle}</small>
      </div>
      <aside>
        <small>{documentNo}</small>
        <small>{dateText}</small>
        <img src="/seflek-logo-white.png" alt="Seflek Tur" />
      </aside>
    </header>
  );
}

function ServiceGroupList({
  lines,
  monthKey,
  groupByVehicle,
  showMoney = true
}: {
  lines: ServiceLine[];
  monthKey: string;
  groupByVehicle: boolean;
  showMoney?: boolean;
}) {
  const groups = groupServiceLines(lines, groupByVehicle);
  return (
    <div className="report-groups">
      {groups.map((group) => (
        <section className="report-group" key={group.key}>
          <div className="report-group-head">
            <strong>{group.title}</strong>
            <span>{group.serviceCount} servis</span>
            {showMoney ? <b>{formatTRY(group.amount)}</b> : <b>Ücret gizli</b>}
          </div>
          {group.rows.map((row) => (
            <article className="report-service-row" key={row.key}>
              <div className={`report-service-grid ${showMoney ? "" : "no-money"}`}>
                <strong>{row.title}</strong>
                <span>{row.serviceCount} servis</span>
                {showMoney ? (
                  <>
                    <span>{formatTRY(row.unitPrice)}</span>
                    <span>{formatTRY(row.amount)}</span>
                  </>
                ) : null}
              </div>
              {row.lines.every((line) => serviceMarkClass(line.serviceType) === "oneoff")
                ? <OneOffLineList lines={row.lines} showMoney={showMoney} />
                : <MiniMonth days={row.lines} monthKey={monthKey} />}
            </article>
          ))}
        </section>
      ))}
      {groups.length === 0 ? <p className="muted">Bu dönem kesilecek servis satırı yok.</p> : null}
    </div>
  );
}

function ServiceLegend() {
  return (
    <div className="service-legend">
      <span><b className="legend-dot done">✓</b> Sabah / Akşam</span>
      <span><b className="legend-dot overtime">✓</b> Mesai</span>
      <span><b className="legend-dot night">✓</b> Gece</span>
      <span><b className="legend-dot oneoff">•</b> Tek seferlik işler liste satırı</span>
    </div>
  );
}

function OneOffLineList({ lines, showMoney = true }: { lines: ServiceLine[]; showMoney?: boolean }) {
  return (
    <div className="one-off-line-list">
      {lines.map((line) => (
        <span key={line.id}>
          {line.serviceDate?.toLocaleDateString("tr-TR") ?? "-"} · {line.vehicleName ?? "Araç"} · {line.serviceCount} servis{showMoney ? ` · ${formatTRY(Number(line.amount))}` : ""}
        </span>
      ))}
    </div>
  );
}

function ExpenseCardList({ expenses }: { expenses: ExpenseLine[] }) {
  return (
    <div className="expense-card-list">
      {expenses.map((expense) => (
        <article className="expense-card" key={expense.id}>
          <div>
            <strong>{expense.title}</strong>
            <span>{[expense.ownerName, expense.vehicleName ?? "Genel"].filter(Boolean).join(" · ")}</span>
          </div>
          <time>{expense.serviceDate?.toLocaleDateString("tr-TR") ?? "-"}</time>
          <span>{expense.description ?? "-"}</span>
          <b>{formatTRY(Number(expense.amount))}</b>
        </article>
      ))}
      {expenses.length === 0 ? <p className="muted">Bu dönem gider yok.</p> : null}
    </div>
  );
}

function MiniMonth({ days, monthKey }: { days: ServiceLine[]; monthKey: string }) {
  const monthLength = getMonthLength(monthKey);
  const dayMap = new Map<number, string>();
  for (const day of days) {
    if (!day.serviceDate) continue;
    const date = new Date(day.serviceDate);
    const index = date.getDate();
    dayMap.set(index, serviceMarkClass(day.serviceType));
  }

  return (
    <div className="day-ticks" aria-label="Ay günleri">
      {Array.from({ length: 31 }, (_, index) => {
        const day = index + 1;
        const mark = dayMap.get(day);
        return (
          <span className={`day-box ${day > monthLength ? "disabled" : ""} ${mark ?? ""}`} key={day}>
            <b>{mark ? "✓" : ""}</b>
            <small>{day}</small>
          </span>
        );
      })}
    </div>
  );
}

function Metric({ label, value, tone = "dark" }: { label: string; value: string; tone?: "dark" | "blue" | "orange" | "green" }) {
  return (
    <article className={`report-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function ReportFooter() {
  return (
    <footer className="report-footer">
      <span>SeflekTur TransitOS tarafından hazırlanmıştır.</span>
      <span>A4 yazdırma düzeni</span>
    </footer>
  );
}

function groupServiceLines(lines: ServiceLine[], groupByVehicle: boolean) {
  const groups = new Map<string, {
    key: string;
    title: string;
    serviceCount: number;
    amount: number;
    rows: Map<string, {
      key: string;
      title: string;
      serviceCount: number;
      unitPrice: number;
      amount: number;
      lines: ServiceLine[];
    }>;
  }>();

  for (const line of lines) {
    const groupTitle = groupByVehicle ? line.vehicleName || "Araç" : line.routeName || line.title || "Güzergah";
    const group = groups.get(groupTitle) ?? {
      key: groupTitle,
      title: groupTitle,
      serviceCount: 0,
      amount: 0,
      rows: new Map()
    };
    const unitPrice = Number(line.unitPrice);
    const rowTitle = groupByVehicle
      ? `${line.projectName ?? "Tek seferlik iş"} / ${line.routeName ?? line.title ?? "Güzergah"}`
      : `${line.routeName ?? line.title ?? "Güzergah"} / ${line.vehicleName ?? "Araç"}`;
    const rowKey = `${rowTitle}-${line.serviceType}-${unitPrice}`;
    const row = group.rows.get(rowKey) ?? {
      key: rowKey,
      title: rowTitle,
      serviceCount: 0,
      unitPrice,
      amount: 0,
      lines: []
    };

    row.serviceCount += line.serviceCount;
    row.amount += Number(line.amount);
    row.lines.push(line);
    group.serviceCount += line.serviceCount;
    group.amount += Number(line.amount);
    group.rows.set(rowKey, row);
    groups.set(groupTitle, group);
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    rows: Array.from(group.rows.values()).sort((a, b) => b.amount - a.amount)
  }));
}

function getMonthLength(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return 31;
  return new Date(year, month, 0).getDate();
}

function serviceMarkClass(type?: string | null) {
  const normalized = String(type ?? "").toLocaleLowerCase("tr-TR");
  if (normalized.includes("mesai")) return "overtime";
  if (normalized.includes("gece")) return "night";
  if (normalized.includes("tek")) return "oneoff";
  return "done";
}
