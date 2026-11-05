import { cookies } from "next/headers";
import { FinancialDocumentType } from "@prisma/client";
import { AppShell } from "@/app/components/AppShell";
import { PeriodFilter } from "@/app/components/PeriodFilter";
import { readSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatTRY } from "@/lib/format";
import { parsePeriod, periodDateWhere } from "@/lib/period";
import { isManager } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function FinancePage({ searchParams }: { searchParams?: Promise<{ month?: string; range?: string }> }) {
  const params = await searchParams;
  const period = parsePeriod(params);
  const token = (await cookies()).get("transitos_session")?.value;
  const user = token ? await readSessionToken(token).catch(() => null) : null;
  if (!isManager(user)) return <AppShell active="/transitos/finance" title="Finans" subtitle="Şeflek Tur iş ve kârlılık özeti."><section className="card muted">Bu panel yalnızca yöneticilere açıktır.</section></AppShell>;

  const [assignments, expenses, maintenance, documents, vehicleStats] = await Promise.all([
    prisma.serviceAssignment.findMany({ where: { serviceDate: periodDateWhere(period) }, select: { clientPricePerService: true, pricePerService: true, serviceCount: true } }),
    prisma.expense.findMany({ where: { expenseDate: periodDateWhere(period) }, select: { amount: true } }),
    prisma.vehicleMaintenance.findMany({ where: { serviceDate: periodDateWhere(period) }, select: { amount: true } }),
    prisma.financialDocument.findMany({ where: { monthKey: period.month }, select: { type: true, netAmount: true } }),
    prisma.vehicle.groupBy({ by: ["fleetTrackingEnabled", "status"], _count: { _all: true } })
  ]);

  const projectedRevenue = assignments.reduce((sum, x) => sum + Number(x.clientPricePerService) * x.serviceCount, 0);
  const carrierCost = assignments.reduce((sum, x) => sum + Number(x.pricePerService) * x.serviceCount, 0);
  const operatingExpense = expenses.reduce((sum, x) => sum + Number(x.amount), 0);
  const maintenanceCost = maintenance.reduce((sum, x) => sum + Number(x.amount), 0);
  const grossProfit = projectedRevenue - carrierCost - operatingExpense - maintenanceCost;
  const margin = projectedRevenue ? (grossProfit / projectedRevenue) * 100 : 0;
  const invoiced = documents.filter((x) => x.type === FinancialDocumentType.PROJECT_INVOICE).reduce((sum, x) => sum + Number(x.netAmount), 0);
  const paidEarnings = documents.filter((x) => x.type === FinancialDocumentType.SUBCONTRACTOR_EARNING).reduce((sum, x) => sum + Number(x.netAmount), 0);
  const fleetTotal = vehicleStats.reduce((sum, x) => sum + x._count._all, 0);
  const trackedFleet = vehicleStats.filter((x) => x.fleetTrackingEnabled).reduce((sum, x) => sum + x._count._all, 0);
  const maxBar = Math.max(projectedRevenue, carrierCost + operatingExpense + maintenanceCost, 1);

  return (
    <AppShell active="/transitos/finance" title="Finans" subtitle="Gelir, maliyet, kârlılık ve filo etkisini tek görünümde izleyin.">
      <PeriodFilter searchParams={params} />
      <section className="finance-hero section">
        <div><span>Dönem tahmini faaliyet sonucu</span><strong>{formatTRY(grossProfit)}</strong><small className={grossProfit >= 0 ? "positive" : "negative"}>Brüt marj %{margin.toFixed(1).replace(".", ",")}</small></div>
        <div className="finance-bars" aria-label="Gelir ve maliyet karşılaştırması">
          <FinanceBar label="Operasyon geliri" value={projectedRevenue} max={maxBar} tone="revenue" />
          <FinanceBar label="Toplam maliyet" value={carrierCost + operatingExpense + maintenanceCost} max={maxBar} tone="cost" />
        </div>
      </section>
      <section className="finance-kpi-grid section">
        <FinanceMetric label="Operasyon geliri" value={formatTRY(projectedRevenue)} detail={`${assignments.length} servis kaydı`} />
        <FinanceMetric label="Taşıyıcı maliyeti" value={formatTRY(carrierCost)} detail="Planlanan servis bedelleri" />
        <FinanceMetric label="Genel giderler" value={formatTRY(operatingExpense)} detail={`${expenses.length} gider kaydı`} />
        <FinanceMetric label="Filo bakımı" value={formatTRY(maintenanceCost)} detail={`${maintenance.length} bakım kaydı`} />
      </section>
      <section className="finance-detail-grid section">
        <article className="card finance-ledger-card"><h2>Belge durumu</h2><div className="finance-ledger-row"><span>Kesilmiş şirket faturaları</span><strong>{formatTRY(invoiced)}</strong></div><div className="finance-ledger-row"><span>Kesilmiş taşeron hakedişleri</span><strong>{formatTRY(paidEarnings)}</strong></div><a className="primary compact-button" href={`/transitos/earnings?month=${period.month}`}>Fatura ve hakediş merkezine git</a></article>
        <article className="card finance-ledger-card"><h2>Filo görünümü</h2><div className="fleet-ring" style={{ "--fleet-progress": `${fleetTotal ? (trackedFleet / fleetTotal) * 100 : 0}%` } as React.CSSProperties}><strong>{trackedFleet}</strong><span>/ {fleetTotal}</span></div><p>Filo takip sistemine dahil edilen araçlar.</p><a className="ghost compact-button" href="/transitos/vehicles">Araç kayıtlarını yönet</a></article>
      </section>
    </AppShell>
  );
}

function FinanceMetric({ label, value, detail }: { label: string; value: string; detail: string }) { return <article className="card finance-kpi"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }
function FinanceBar({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) { return <div className="finance-bar"><span>{label}<strong>{formatTRY(value)}</strong></span><i><b className={tone} style={{ width: `${Math.max(4, (value / max) * 100)}%` }} /></i></div>; }
