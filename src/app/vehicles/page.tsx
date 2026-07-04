import { cookies } from "next/headers";
import { AppShell, DeleteButton, Field, ModalAction, SubmitButton } from "@/app/components/AppShell";
import { ExpandableProfileCard, InlineDisclosureMenu, RegistryStatusPills } from "@/app/components/RegistryInterfaceKit";
import { PeriodFilter } from "@/app/components/PeriodFilter";
import { createVehicle, deleteVehicle, updateVehicle } from "@/app/actions";
import { readSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatTRY } from "@/lib/format";
import { parsePeriod, periodDateWhere } from "@/lib/period";
import {
  assignmentAccessWhere,
  canEditOperations,
  canSeeSubcontractorMoney,
  isProjectOwner,
  isSubcontractor,
  vehicleAccessWhere
} from "@/lib/permissions";
import { serviceDirectionTitle } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function VehiclesPage({
  searchParams
}: {
  searchParams?: Promise<{ month?: string; range?: string }>;
}) {
  const params = await searchParams;
  const period = parsePeriod(params);
  const sessionCookie = (await cookies()).get("transitos_session")?.value;
  const user = sessionCookie ? await readSessionToken(sessionCookie).catch(() => null) : null;
  const canEdit = canEditOperations(user);
  const showMoney = canSeeSubcontractorMoney(user);
  const compactAssetView = isSubcontractor(user) || isProjectOwner(user);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const [vehicles, subcontractors] = await Promise.all([
    prisma.vehicle.findMany({
      where: vehicleAccessWhere(user),
      include: {
        subcontractor: true,
        assignments: {
          where: { ...assignmentAccessWhere(user), serviceDate: periodDateWhere(period) },
          include: { route: { include: { project: true } } },
          orderBy: [{ serviceDate: "desc" }, { serviceTime: "asc" }]
        }
      },
      orderBy: { fleetNumber: "asc" }
    }),
    prisma.subcontractor.findMany({ orderBy: { companyName: "asc" } })
  ]);

  return (
    <AppShell active="/transitos/vehicles" title="Araçlar" subtitle="Taşeron araçları, şoför bilgileri ve durum takibi.">
      <div className="toolbar" style={{ marginBottom: 16 }}>
        {canEdit ? <ModalAction label="Araç Ekle" title="Araç Ekle">
          <form className="stack" action={createVehicle}>
            <VehicleFields subcontractors={subcontractors} />
            <div className="actions"><SubmitButton>✓ Araç Ekle</SubmitButton></div>
          </form>
        </ModalAction> : null}
      </div>
      <PeriodFilter searchParams={params} />

      <section className="stack">
        {vehicles.map((vehicle) => {
          const completed = vehicle.assignments.filter((item) => item.serviceDate <= endOfToday).length;
          const planned = vehicle.assignments.length - completed;
          const completedEarning = vehicle.assignments
            .filter((item) => item.serviceDate <= endOfToday)
            .reduce((sum, item) => sum + Number(item.pricePerService) * item.serviceCount, 0);
          const totalPotentialEarning = vehicle.assignments.reduce((sum, item) => sum + Number(item.pricePerService) * item.serviceCount, 0);
          const pendingEarning = vehicle.assignments
            .filter((item) => item.serviceDate > endOfToday)
            .reduce((sum, item) => sum + Number(item.pricePerService) * item.serviceCount, 0);
          const groupedAssignments = groupVehicleAssignments(vehicle.assignments);
          const visibleGroups = compactAssetView ? groupedAssignments.slice(0, 2) : groupedAssignments.slice(0, 4);
          return (
          <section className={`card status-card ${compactAssetView ? "compact-asset-card" : ""}`} key={vehicle.id}>
            <div className="record-head">
              <div>
                <h2 style={{ margin: 0 }}>{vehicle.fleetNumber} · {vehicle.plateNumber}</h2>
                <div className="chip-row">
                  <span className={vehicle.status === "ACTIVE" ? "badge green" : vehicle.status === "MAINTENANCE" ? "badge red" : "badge gray"}>{vehicle.status === "ACTIVE" ? "Aktif" : vehicle.status === "MAINTENANCE" ? "Bakımda" : "Pasif"}</span>
                  <span className="badge green">✓ {completed} taşındı</span>
                  <span className="badge yellow">◷ {planned} plan</span>
                  {showMoney ? <span className="badge green">✓ {formatTRY(completedEarning)}</span> : null}
                  {showMoney ? <span className="badge yellow">◷ Tamamlanmamış {formatTRY(pendingEarning)}</span> : null}
                  {showMoney ? <span className="badge gray">Toplam {formatTRY(totalPotentialEarning)}</span> : null}
                </div>
              </div>
              {canEdit ? (
                <InlineDisclosureMenu label="..." tone="blue">
                  <ModalAction label="Düzenle" title={`${vehicle.fleetNumber} İşlemleri`}>
                    <div className="stack">
                      <form className="stack" action={updateVehicle}>
                        <input type="hidden" name="id" value={vehicle.id} />
                        <VehicleFields vehicle={vehicle} subcontractors={subcontractors} />
                        <div className="actions"><SubmitButton>✓ Güncelle</SubmitButton></div>
                      </form>
                      <form className="stack" action={deleteVehicle}>
                        <input type="hidden" name="id" value={vehicle.id} />
                        <p>Bu araç ve bağlı plan kayıtları silinecek.</p>
                        <div className="actions"><DeleteButton>Araç Sil</DeleteButton></div>
                      </form>
                    </div>
                  </ModalAction>
                </InlineDisclosureMenu>
              ) : null}
            </div>
            <div className="section">
              <ExpandableProfileCard
                title={`${vehicle.make ?? "-"} ${vehicle.model ?? ""}`}
                subtitle={`${vehicle.modelYear ?? "-"} · ${vehicle.capacity} koltuk`}
                meta={`Taşeron: ${vehicle.subcontractor?.companyName ?? "Atanmamış"}`}
                badge={<span className="badge blue">Şoför</span>}
              >
                <p className="muted">Şoför: {vehicle.driverName ?? "-"} · {vehicle.driverPhone ?? "-"}</p>
                <RegistryStatusPills
                  items={[
                    { label: "taşındı", value: completed, tone: "green" },
                    { label: "plan", value: planned, tone: "yellow" },
                    { label: "iş grubu", value: groupedAssignments.length, tone: "blue" }
                  ]}
                />
              </ExpandableProfileCard>
              {vehicle.assignments.length > 0 ? (
                <div className="vehicle-job-summary">
                  {visibleGroups.map((group) => (
                    <article className="vehicle-job-pill" key={group.key}>
                      <strong>{group.routeName}</strong>
                      <span className="muted">{group.projectName} · {group.directionTitle}</span>
                      <div className="chip-row">
                        <span className="badge green">✓ {group.completed}</span>
                        <span className="badge yellow">◷ {group.planned}</span>
                        {showMoney ? <span className="badge gray">{formatTRY(group.completedAmount)}</span> : null}
                      </div>
                    </article>
                  ))}
                  {!compactAssetView ? <ModalAction label={`Tüm İşler (${vehicle.assignments.length})`} title={`${vehicle.fleetNumber} İş Detayı`}>
                    <VehicleAssignmentsDetail assignments={vehicle.assignments} showMoney={showMoney} endOfToday={endOfToday} />
                  </ModalAction> : (
                    <div className="vehicle-compact-note">
                      Bu dönem {vehicle.assignments.length} kayıt · {completed} tamamlandı · {planned} planlandı
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </section>
        );})}
        {vehicles.length === 0 ? <section className="card muted">Henüz araç kaydı yok.</section> : null}
      </section>
    </AppShell>
  );
}

function VehicleAssignmentsDetail({ assignments, showMoney, endOfToday }: { assignments: any[]; showMoney: boolean; endOfToday: Date }) {
  return (
    <div className="stack">
      <table className="table">
        <thead><tr><th>Durum</th><th>Tarih</th><th>Saat</th><th>Proje</th><th>Güzergah</th><th>Tür</th><th>Servis</th><th>Tutar</th></tr></thead>
        <tbody>
          {assignments.map((item) => {
            const done = item.serviceDate <= endOfToday;
            const amount = Number(item.pricePerService) * item.serviceCount;
            return (
              <tr key={item.id}>
                <td><span className={done ? "badge green" : "badge yellow"}>{done ? "✓ Taşındı" : "◷ Planlandı"}</span></td>
                <td>{item.serviceDate.toLocaleDateString("tr-TR")}</td>
                <td>{item.serviceTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</td>
                <td>{item.route.project?.name ?? "Tek seferlik iş"}</td>
                <td>{item.route.name}</td>
                <td>{serviceDirectionTitle(item.direction)}</td>
                <td>{item.serviceCount}</td>
                <td>{showMoney ? formatTRY(done ? amount : 0) : "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function groupVehicleAssignments(assignments: any[]) {
  const groups = new Map<string, {
    key: string;
    routeName: string;
    projectName: string;
    directionTitle: string;
    completed: number;
    planned: number;
    completedAmount: number;
  }>();
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  for (const item of assignments) {
    const key = `${item.routeId}-${item.direction}`;
    const group = groups.get(key) ?? {
      key,
      routeName: item.route.name,
      projectName: item.route.project?.name ?? "Tek seferlik iş",
      directionTitle: serviceDirectionTitle(item.direction),
      completed: 0,
      planned: 0,
      completedAmount: 0
    };
    if (item.serviceDate <= endOfToday) {
      group.completed += item.serviceCount;
      group.completedAmount += Number(item.pricePerService) * item.serviceCount;
    } else {
      group.planned += item.serviceCount;
    }
    groups.set(key, group);
  }

  return Array.from(groups.values()).sort((a, b) => (b.completed + b.planned) - (a.completed + a.planned));
}

function VehicleFields({ vehicle, subcontractors }: { vehicle?: any; subcontractors: { id: string; companyName: string }[] }) {
  return (
    <>
      <Field label="Araç kodu" hint="Filoda görünen kısa kod."><input name="fleetNumber" defaultValue={vehicle?.fleetNumber ?? ""} required /></Field>
      <Field label="Plaka" hint="Resmi araç plakası."><input name="plateNumber" defaultValue={vehicle?.plateNumber ?? ""} required /></Field>
      <Field label="Taşeron" hint="Aracın bağlı olduğu taşeron.">
        <select name="subcontractorId" defaultValue={vehicle?.subcontractorId ?? ""}>
          <option value="">Atanmamış</option>
          {subcontractors.map((item) => <option key={item.id} value={item.id}>{item.companyName}</option>)}
        </select>
      </Field>
      <Field label="Marka" hint="Araç markası."><input name="make" defaultValue={vehicle?.make ?? ""} /></Field>
      <Field label="Model" hint="Araç modeli."><input name="model" defaultValue={vehicle?.model ?? ""} /></Field>
      <Field label="Model yılı" hint="Örn. 2024."><input name="modelYear" defaultValue={vehicle?.modelYear ?? ""} /></Field>
      <Field label="Kapasite" hint="Koltuk/personel kapasitesi."><input name="capacity" type="number" defaultValue={vehicle?.capacity ?? 0} /></Field>
      <Field label="Durum" hint="Aktif, pasif veya bakımda.">
        <select name="status" defaultValue={vehicle?.status ?? "ACTIVE"}>
          <option value="ACTIVE">Aktif</option>
          <option value="PASSIVE">Pasif</option>
          <option value="MAINTENANCE">Bakımda</option>
        </select>
      </Field>
      <Field label="Şoför" hint="Ad soyad."><input name="driverName" defaultValue={vehicle?.driverName ?? ""} /></Field>
      <Field label="Şoför telefon" hint="+90 formatında saklanır."><input name="driverPhone" defaultValue={vehicle?.driverPhone ?? ""} /></Field>
    </>
  );
}
