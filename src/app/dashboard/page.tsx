import { AlertTriangle, Bus, CalendarDays, FolderKanban, MapPinned, Users } from "lucide-react";
import { FinancialDocumentType } from "@prisma/client";
import { AppShell, ModalAction } from "@/app/components/AppShell";
import { PeriodFilter } from "@/app/components/PeriodFilter";
import { CalendarMiniPanel, RegistryStatusPills } from "@/app/components/RegistryInterfaceKit";
import { YandexTrafficMap } from "@/app/components/YandexTrafficMap";
import { prisma } from "@/lib/db";
import { formatTRY } from "@/lib/format";
import { parsePeriod } from "@/lib/period";
import { serviceDirectionTitle } from "@/lib/labels";
import { getFastTrafficSnapshot, istanbulTrafficMapEmbedUrl } from "@/lib/traffic";
import { cookies } from "next/headers";
import { readSessionToken } from "@/lib/auth";
import {
  assignmentAccessWhere,
  canEditOperations,
  isProjectOwner,
  isManager,
  isSubcontractor,
  projectAccessWhere,
  vehicleAccessWhere
} from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<{ month?: string }> }) {
  const params = await searchParams;
  const period = parsePeriod({ month: params?.month, range: "1" });
  const sessionCookie = (await cookies()).get("transitos_session")?.value;
  const user = sessionCookie ? await readSessionToken(sessionCookie).catch(() => null) : null;
  const subcontractorView = isSubcontractor(user);
  const projectOwnerView = isProjectOwner(user);
  const canEdit = canEditOperations(user);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
  const previousMonthKey = `${previousMonthStart.getFullYear()}-${String(previousMonthStart.getMonth() + 1).padStart(2, "0")}`;
  const [calendarYear, calendarMonth] = period.month.split("-").map(Number);
  const calendarStart = new Date(calendarYear, calendarMonth - 1, 1);
  const calendarEnd = new Date(calendarYear, calendarMonth, 0, 23, 59, 59, 999);

  const vehicleScope = vehicleAccessWhere(user);
  const assignmentScope = assignmentAccessWhere(user);
  const projectScope = projectAccessWhere(user);

  const [subcontractors, vehicles, activeProjects, todayAssignments, trafficSnapshot, pendingPreviousEarnings, monthAssignments] = await Promise.all([
    projectOwnerView || subcontractorView ? Promise.resolve(0) : prisma.subcontractor.count(),
    prisma.vehicle.count({ where: vehicleScope }),
    prisma.project.count({ where: { status: "ACTIVE", ...projectScope } }),
    prisma.serviceAssignment.findMany({
      where: { serviceDate: { gte: today, lt: tomorrow }, ...assignmentScope },
      include: { route: true, vehicle: true, project: true },
      orderBy: { serviceTime: "asc" }
    }),
    getFastTrafficSnapshot(),
    isManager(user) ? prisma.subcontractor.findMany({
      where: {
        vehicles: { some: { assignments: { some: { serviceDate: { gte: previousMonthStart, lte: previousMonthEnd } } } } },
        financialDocuments: { none: { type: FinancialDocumentType.SUBCONTRACTOR_EARNING, monthKey: previousMonthKey } }
      },
      select: {
        id: true,
        companyName: true,
        vehicles: {
          select: {
            assignments: {
              where: { serviceDate: { gte: previousMonthStart, lte: previousMonthEnd } },
              select: { pricePerService: true, serviceCount: true }
            }
          }
        },
        expenses: {
          where: { expenseDate: { gte: previousMonthStart, lte: previousMonthEnd } },
          select: { amount: true }
        }
      },
      orderBy: { companyName: "asc" }
    }) : Promise.resolve([]),
    prisma.serviceAssignment.findMany({
      where: { serviceDate: { gte: calendarStart, lte: calendarEnd }, ...assignmentScope },
      include: { route: true, vehicle: true, project: true },
      orderBy: [{ serviceDate: "asc" }, { serviceTime: "asc" }]
    })
  ]);
  const trafficItems = trafficSnapshot.items;
  const pendingPreviousEarningTotal = pendingPreviousEarnings.reduce((total, subcontractor) => {
    const gross = subcontractor.vehicles.flatMap((vehicle) => vehicle.assignments)
      .reduce((sum, assignment) => sum + Number(assignment.pricePerService) * assignment.serviceCount, 0);
    const expenses = subcontractor.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    return total + gross - expenses;
  }, 0);
  const calendarAssignmentsByDay = new Map<string, typeof monthAssignments>();
  for (const assignment of monthAssignments) {
    const key = localDateKey(assignment.serviceDate);
    const items = calendarAssignmentsByDay.get(key) ?? [];
    items.push(assignment);
    calendarAssignmentsByDay.set(key, items);
  }

  return (
    <AppShell active="/dashboard" title="Ana Panel" subtitle="SeflekTur TransitOS Cloud v2.0 ortak veri merkezi">
      <div className="grid">
        {!projectOwnerView && !subcontractorView ? <Metric title="Taşeronlar" value={subcontractors} icon={<Users size={22} />} /> : null}
        <Metric title="Araçlar" value={vehicles} icon={<Bus size={22} />} />
        <Metric title="Aktif Projeler" value={activeProjects} icon={<FolderKanban size={22} />} />
        <Metric title="Bugünkü Servis" value={todayAssignments.length} icon={<CalendarDays size={22} />} />
      </div>

      {pendingPreviousEarnings.length > 0 ? (
        <section className="earning-warning" role="status" aria-live="polite">
          <AlertTriangle size={24} aria-hidden="true" />
          <div>
            <strong>Önceki aydan kesilmemiş hakediş var</strong>
            <p>{previousMonthKey} döneminde {pendingPreviousEarnings.length} taşeron için toplam {formatTRY(pendingPreviousEarningTotal)} hakediş kesilmeyi bekliyor.</p>
            <small>{pendingPreviousEarnings.map((item) => item.companyName).join(", ")}</small>
          </div>
          <a className="primary compact-button" href={`/transitos/earnings?month=${previousMonthKey}&range=1`}>Hakedişleri kontrol et</a>
        </section>
      ) : null}

      <section className="dashboard-timeline section" aria-labelledby="daily-timeline-title">
        <div className="dashboard-section-head">
          <div>
            <span className="dashboard-kicker">Bugün</span>
            <h2 id="daily-timeline-title">Operasyon akışı</h2>
          </div>
          <span className="badge blue">{todayAssignments.length} servis</span>
        </div>
        <div className="timeline-list">
          {todayAssignments.map((service) => (
            <CalendarMiniPanel
              key={service.id}
              title={`${service.serviceTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} · ${service.route.name}`}
              body={`${service.project?.name ?? "Tek seferlik iş"} · ${service.vehicle.fleetNumber} · ${serviceDirectionTitle(service.direction)}`}
            />
          ))}
          {todayAssignments.length === 0 ? <p className="dashboard-empty">Bugün için planlanmış servis bulunmuyor.</p> : null}
        </div>
      </section>

      <section className="dashboard-calendar section" aria-labelledby="dashboard-calendar-title">
        <div className="dashboard-calendar-head">
          <div>
            <h2 id="dashboard-calendar-title">Aylık operasyon takvimi</h2>
            <p>Bir güne dokunarak o günün servislerini görüntüleyin.</p>
          </div>
          <PeriodFilter searchParams={{ month: period.month, range: "1" }} />
        </div>
        <div className="dashboard-calendar-grid">
          {Array.from({ length: calendarEnd.getDate() }, (_, index) => {
            const date = new Date(calendarYear, calendarMonth - 1, index + 1);
            const items = calendarAssignmentsByDay.get(localDateKey(date)) ?? [];
            return (
              <ModalAction
                key={date.toISOString()}
                buttonClassName={`dashboard-calendar-day ${date.toDateString() === new Date().toDateString() ? "today" : ""}`}
                title={`${date.toLocaleDateString("tr-TR")} Servisleri`}
                label={<><strong>{date.getDate()}</strong><span>{items.length ? `${items.length} servis` : "—"}</span></>}
              >
                <div className="dashboard-day-list">
                  {items.map((item) => (
                    <article key={item.id}>
                      <strong>{item.serviceTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</strong>
                      <span>{item.route.name}</span>
                      <small>{item.project?.name ?? "Tek seferlik iş"} · {item.vehicle.fleetNumber} · {serviceDirectionTitle(item.direction)}</small>
                    </article>
                  ))}
                  {!items.length ? <p>Bu gün için servis planı yok.</p> : null}
                </div>
              </ModalAction>
            );
          })}
        </div>
        {canEdit ? <a className="dashboard-project-link" href={`/transitos/projects?month=${period.month}&range=1`}>Servis planlamaya git</a> : null}
      </section>

      <section className="dashboard-columns section">
        <article className="card">
          <div className="record-head">
            <div>
              <h2 style={{ marginTop: 0 }}>İstanbul Trafik Yoğunluğu</h2>
              <p className="muted">Harita üzerindeki yeşil, sarı ve kırmızı yoğunluk renkleri canlı trafik katmanından gelir.</p>
            </div>
            <a className="ghost compact-button" href="https://yandex.com/maps/11508/istanbul/?l=trf%2Ctrfe&z=10" target="_blank" rel="noreferrer">
              <MapPinned size={16} />
              Yandex Trafik
            </a>
          </div>
          <YandexTrafficMap
            title="İstanbul canlı trafik haritası"
            center={[41.0438, 28.7768]}
            zoom={10}
            fallbackEmbedUrl={istanbulTrafficMapEmbedUrl()}
          />
          <div className="traffic-source-row">
            <span>{trafficSnapshot.source}</span>
            <small>{trafficSnapshot.updatedAt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} güncellendi</small>
          </div>
          {trafficItems.length > 0 ? (
            <>
            <RegistryStatusPills
              items={trafficItems.slice(0, 4).map((item) => ({
                label: item.name,
                value: `%${item.level}`,
                tone: item.level > 74 ? "red" : item.level > 54 ? "yellow" : "green"
              }))}
            />
            <div className="traffic-grid section">
              {trafficItems.map((item) => (
                <div className="traffic-row" key={item.name}>
                  <span>{item.name}<small>{item.note}</small></span>
                  <strong className={item.level > 74 ? "traffic-high" : item.level > 54 ? "traffic-mid" : "traffic-low"}>%{item.level}</strong>
                </div>
              ))}
            </div>
            </>
          ) : (
            <div className="traffic-empty section">
              <strong>Sayısal yoğunluk okunamadı</strong>
              <p className="muted">Harita üzerindeki kırmızı, sarı ve yeşil trafik katmanı canlı olarak görüntülenir. Bölgesel yüzde verisi için İBB canlı kaynağı yanıt verdiğinde liste otomatik dolar.</p>
              <div className="traffic-legend">
                <span><i className="traffic-dot low" />Akıcı</span>
                <span><i className="traffic-dot mid" />Yoğun</span>
                <span><i className="traffic-dot high" />Çok yoğun</span>
              </div>
            </div>
          )}
        </article>
      </section>

    </AppShell>
  );
}
function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function Metric({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <article className="card metric">
      <div style={{ color: "var(--cyan)" }}>{icon}</div>
      <span className="muted">{title}</span>
      <strong>{value}</strong>
    </article>
  );
}
