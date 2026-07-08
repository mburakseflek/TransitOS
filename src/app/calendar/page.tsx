import { cookies } from "next/headers";
import { Trash2 } from "lucide-react";
import { AppShell, DeleteButton, ModalAction } from "@/app/components/AppShell";
import { PeriodFilter } from "@/app/components/PeriodFilter";
import { deleteAssignment } from "@/app/actions";
import { readSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serviceDirectionTitle } from "@/lib/labels";
import { parsePeriod } from "@/lib/period";
import { assignmentAccessWhere, canEditOperations } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams
}: {
  searchParams?: Promise<{ month?: string; range?: string }>;
}) {
  const params = await searchParams;
  const period = parsePeriod({ month: params?.month, range: "1" });
  const sessionCookie = (await cookies()).get("transitos_session")?.value;
  const user = sessionCookie ? await readSessionToken(sessionCookie).catch(() => null) : null;
  const canEdit = canEditOperations(user);
  const today = new Date();
  const [selectedYear, selectedMonth] = period.month.split("-").map(Number);
  const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
  const monthEnd = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

  const assignments = await prisma.serviceAssignment.findMany({
    where: {
      serviceDate: { gte: monthStart, lte: monthEnd },
      ...assignmentAccessWhere(user)
    },
    include: { route: true, project: true, vehicle: true },
    orderBy: [{ serviceDate: "asc" }, { serviceTime: "asc" }]
  });

  const days = Array.from({ length: monthEnd.getDate() }, (_, index) => {
    const date = new Date(selectedYear, selectedMonth - 1, index + 1);
    const key = localDateKey(date);
    return {
      date,
      key,
      assignments: assignments.filter((assignment) => localDateKey(assignment.serviceDate) === key)
    };
  });

  return (
    <AppShell active="/transitos/calendar" title="Takvim" subtitle="Ay içindeki servis planı, tamamlanan işler ve operasyon yoğunluğu.">
      <PeriodFilter searchParams={{ month: period.month, range: "1" }} />
      <section className="calendar-month-grid">
        {days.map((day) => {
          const isToday = day.date.toDateString() === today.toDateString();
          return (
            <ModalAction
              buttonClassName={`card calendar-day-button ${isToday ? "today" : ""}`}
              label={<CalendarDayPreview day={day} />}
              title={`${day.date.toLocaleDateString("tr-TR")} Gün Organizer`}
              key={day.key}
            >
              <div className="calendar-organizer">
                <section className="card">
                  <div className="record-head">
                    <div>
                      <h3 style={{ margin: 0 }}>Günün Servisleri</h3>
                      <p className="muted">{day.assignments.length} servis planı görüntüleniyor.</p>
                    </div>
                    <span className={day.assignments.length ? "badge green" : "badge gray"}>{day.assignments.length} servis</span>
                  </div>
                  <div className="stack section">
                    {day.assignments.map((assignment) => (
                      <div className="calendar-organizer-line" key={assignment.id}>
                        <strong>{assignment.serviceTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</strong>
                        <span>{assignment.route.name}</span>
                        <small className="muted">{assignment.project?.name ?? "Tek seferlik iş"} · {assignment.vehicle.fleetNumber} · {serviceDirectionTitle(assignment.direction)}</small>
                        {canEdit ? (
                          <form action={deleteAssignment}>
                            <input type="hidden" name="id" value={assignment.id} />
                            <input type="hidden" name="_returnTo" value={`/transitos/calendar?month=${period.month}`} />
                            <DeleteButton ariaLabel="Takvim servis kaydını sil">
                              <Trash2 size={17} aria-hidden="true" />
                            </DeleteButton>
                          </form>
                        ) : null}
                      </div>
                    ))}
                    {day.assignments.length === 0 ? <p className="muted">Bu güne servis eklenmemiş.</p> : null}
                  </div>
                </section>

                <p className="muted">Servis ekleme ve fiyatlandırma işlemleri Projeler panelindeki güzergah pencerelerinden yapılır.</p>
              </div>
            </ModalAction>
          );
        })}
      </section>
    </AppShell>
  );
}

function CalendarDayPreview({ day }: { day: { date: Date; assignments: any[] } }) {
  return (
    <span className="calendar-day-preview">
      <span className="record-head">
        <strong>{day.date.getDate()}</strong>
        <span className={day.assignments.length ? "badge green" : "badge gray"}>{day.assignments.length} servis</span>
      </span>
      <span className="stack">
        {day.assignments.slice(0, 3).map((assignment) => (
          <span className="calendar-service-line" key={assignment.id}>
            <span>{assignment.serviceTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
            <strong>{assignment.route.name}</strong>
            <small>{assignment.vehicle.fleetNumber} · {serviceDirectionTitle(assignment.direction)}</small>
          </span>
        ))}
        {day.assignments.length > 3 ? <small className="muted">+{day.assignments.length - 3} servis daha</small> : null}
      </span>
    </span>
  );
}

function localDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}
