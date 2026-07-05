import { cookies } from "next/headers";
import { AppShell, DeleteButton, Field, ModalAction, SubmitButton } from "@/app/components/AppShell";
import {
  AdaptiveSlider,
  FloatingInput,
  FrequencySelector,
  InlineDisclosureMenu,
  QuickCreateCard,
  RegistryStatusPills
} from "@/app/components/RegistryInterfaceKit";
import {
  createAssignment,
  createBulkAssignments,
  createOneOffJob,
  createProject,
  createRoute,
  deleteAssignment,
  deleteOneOffJob,
  deleteProject,
  deleteRoute,
  updateAssignment,
  updateProject,
  updateOneOffJob,
  updateRoute
} from "@/app/actions";
import { prisma } from "@/lib/db";
import { serviceDirectionTitle } from "@/lib/labels";
import { MonthCalendarSelector } from "@/app/components/MonthCalendarSelector";
import { readSessionToken } from "@/lib/auth";
import { formatTRY } from "@/lib/format";
import { parsePeriod, periodDateWhere } from "@/lib/period";
import { canEditOperations, projectAccessWhere, routeAccessWhere, vehicleAccessWhere } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams
}: {
  searchParams?: Promise<{ project?: string; route?: string; month?: string; range?: string }>;
}) {
  const params = await searchParams;
  const period = parsePeriod(params);
  const sessionCookie = (await cookies()).get("transitos_session")?.value;
  const user = sessionCookie ? await readSessionToken(sessionCookie).catch(() => null) : null;
  const canEdit = canEditOperations(user);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const defaultServiceDate = defaultDateForPeriod(period.month);
  const [projects, vehicles, oneOffRoutes, projectOwners] = await Promise.all([
    prisma.project.findMany({
      where: projectAccessWhere(user),
      include: {
        ownerUsers: { select: { id: true, displayName: true, loginId: true } },
        routes: {
          include: {
            assignments: {
              where: { serviceDate: periodDateWhere(period) },
              include: { vehicle: true },
              orderBy: [{ serviceDate: "asc" }, { serviceTime: "asc" }]
            }
          },
          orderBy: { name: "asc" }
        },
        assignments: true
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.vehicle.findMany({ where: vehicleAccessWhere(user), orderBy: { fleetNumber: "asc" } }),
    prisma.serviceRoute.findMany({
      where: { AND: [{ projectId: null }, routeAccessWhere(user)] },
      include: {
        assignments: {
          where: { serviceDate: periodDateWhere(period) },
          include: { vehicle: true }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.user.findMany({
      where: { role: "PROJECT_OWNER" },
      select: { id: true, displayName: true, loginId: true },
      orderBy: { displayName: "asc" }
    })
  ]);
  const selectedProject = projects.find((project) => project.id === params?.project) ?? null;
  const selectedRoute = selectedProject?.routes.find((route) => route.id === params?.route) ?? null;

  return (
    <AppShell active="/transitos/projects" title="Projeler" subtitle="Proje şirketi, güzergahlar, araç planları ve bağımsız tek seferlik işler.">
      <div className="toolbar">
        {canEdit ? <QuickCreateCard title="Proje" body="Şirket, sahibi ve güzergah yapısını ekleyin.">
          <ModalAction label="Proje Ekle" title="Proje Ekle">
            <form className="stack" action={createProject}>
              <input type="hidden" name="_returnTo" value="/transitos/projects" />
              <ProjectFields projectOwners={projectOwners} />
              <div className="actions"><SubmitButton>✓ Proje Ekle</SubmitButton></div>
            </form>
          </ModalAction>
        </QuickCreateCard> : null}

        {canEdit ? <QuickCreateCard title="Tek seferlik iş" body="Projeye bağlamadan bağımsız servis oluşturun.">
          <ModalAction label="Tek Seferlik İş Ekle" title="Tek Seferlik İş Ekle">
            <form className="stack" action={createOneOffJob}>
              <input type="hidden" name="_returnTo" value="/transitos/projects" />
              <OneOffFields vehicles={vehicles} />
              <div className="actions"><SubmitButton>✓ Tek Seferlik İş Ekle</SubmitButton></div>
            </form>
          </ModalAction>
        </QuickCreateCard> : null}
      </div>
      <div className="project-layout section">
        <aside className="card project-list">
          <h2 style={{ marginTop: 0 }}>Projeler</h2>
          <div className="stack">
            {projects.map((project) => (
              <a className={`route-card selectable-card ${selectedProject?.id === project.id ? "selected" : ""}`} href={`/transitos/projects?project=${project.id}&month=${period.month}&range=${period.range}`} key={project.id}>
                <div className="record-head">
                  <strong>{project.name}</strong>
                  <span className={statusClass(project.status)}>{statusTitle(project.status)}</span>
                </div>
                <p className="muted">{project.clientCompany}</p>
                <p className="muted">{project.personnelCount} personel · {project.routes.length} güzergah</p>
              </a>
            ))}
            {projects.length === 0 ? <p className="muted">Henüz proje yok.</p> : null}
          </div>
        </aside>

        <section className="stack">
          {selectedProject ? (
            <ProjectCard project={selectedProject} selectedRoute={selectedRoute} vehicles={vehicles} projectOwners={projectOwners} endOfToday={endOfToday} canEdit={canEdit} showMoney={canEdit} periodMonth={period.month} defaultServiceDate={defaultServiceDate} periodQuery={`month=${period.month}&range=${period.range}`} />
          ) : (
            <section className="card muted">Detayları görmek için soldan bir proje seçin.</section>
          )}
          {projects.length === 0 ? <section className="card muted">Başlamak için Proje Ekle penceresini kullanın.</section> : null}
        </section>
      </div>

      <OneOffJobsPanel routes={oneOffRoutes} vehicles={vehicles} canEdit={canEdit} />
    </AppShell>
  );
}

function ProjectCard({ project, selectedRoute, vehicles, projectOwners, endOfToday, canEdit, showMoney, periodMonth, defaultServiceDate, periodQuery }: { project: any; selectedRoute: any | null; vehicles: any[]; projectOwners: any[]; endOfToday: Date; canEdit: boolean; showMoney: boolean; periodMonth: string; defaultServiceDate: string; periodQuery: string }) {
  const allAssignments = project.routes.flatMap((route: any) => route.assignments);
  const completedAssignments = allAssignments.filter((item: any) => item.serviceDate <= endOfToday);
  const totalServices = completedAssignments.reduce((sum: number, item: any) => sum + item.serviceCount, 0);
  const activeVehicles = new Set(project.routes.flatMap((route: any) => route.assignments.map((item: any) => item.vehicle.fleetNumber)));

  return (
    <section className="card" id={`project-${project.id}`}>
      <div className="record-head">
        <div>
          <h2 style={{ margin: 0 }}>{project.name}</h2>
          <p className="muted">{project.clientCompany}</p>
        </div>
        <div className="toolbar">
          <span className={statusClass(project.status)}>{statusTitle(project.status)}</span>
          {canEdit ? <ModalAction label="Düzenle" title={`${project.name} İşlemleri`}>
            <div className="stack">
              <form className="stack" action={updateProject}>
                <input type="hidden" name="id" value={project.id} />
                <input type="hidden" name="_returnTo" value={`/transitos/projects?project=${project.id}`} />
                <ProjectFields project={project} projectOwners={projectOwners} />
                <div className="actions"><SubmitButton>✓ Güncelle</SubmitButton></div>
              </form>
              <form className="actions" action={deleteProject}>
                <input type="hidden" name="id" value={project.id} />
                <input type="hidden" name="_returnTo" value="/transitos/projects" />
                <DeleteButton>Projeyi Sil</DeleteButton>
              </form>
            </div>
          </ModalAction> : null}
        </div>
      </div>

      <div className="grid section">
        <Metric title="Personel" value={project.personnelCount} />
        <Metric title="Güzergah" value={project.routes.length} />
        <Metric title="Taşınan Servis" value={totalServices} />
        <Metric title="Planlanan" value={allAssignments.length - completedAssignments.length} />
        <Metric title="Bağlı Araç" value={activeVehicles.size} />
      </div>
      <RegistryStatusPills
        items={[
          { label: "tamamlanan", value: totalServices, tone: "green" },
          { label: "plan", value: allAssignments.length - completedAssignments.length, tone: "yellow" },
          { label: "aktif araç", value: activeVehicles.size, tone: "blue" }
        ]}
      />
      <div className="chip-row section">
        <span className="badge blue">Proje sahipleri</span>
        {project.ownerUsers.length ? project.ownerUsers.map((owner: any) => (
          <span className="badge gray" key={owner.id}>{owner.displayName} · {owner.loginId}</span>
        )) : <span className="badge yellow">Henüz proje sahibi atanmadı</span>}
      </div>

      <div className="record-head section">
        <h3 style={{ margin: 0 }}>Güzergahlar</h3>
        {canEdit ? <ModalAction label="Güzergah Ekle" title="Güzergah Ekle">
          <form className="stack" action={createRoute}>
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="_returnTo" value={`/transitos/projects?project=${project.id}`} />
            <RouteFields />
            <div className="actions"><SubmitButton>✓ Güzergah Ekle</SubmitButton></div>
          </form>
        </ModalAction> : null}
      </div>

      <div className="stack section">
        {project.routes.map((route: any) => (
          <RouteCard route={route} project={project} selected={selectedRoute?.id === route.id} vehicles={vehicles} endOfToday={endOfToday} canEdit={canEdit} showMoney={showMoney} periodMonth={periodMonth} defaultServiceDate={defaultServiceDate} periodQuery={periodQuery} key={route.id} />
        ))}
        {project.routes.length === 0 ? <p className="muted">Bu projeye henüz güzergah eklenmemiş.</p> : null}
      </div>

      {!selectedRoute && project.routes.length > 0 ? (
        <p className="muted section">Mesai ve planları görmek için bir güzergah seçin.</p>
      ) : null}
    </section>
  );
}

function RouteCard({ route, project, selected, vehicles, endOfToday, canEdit, showMoney, periodMonth, defaultServiceDate, periodQuery }: { route: any; project: any; selected: boolean; vehicles: any[]; endOfToday: Date; canEdit: boolean; showMoney: boolean; periodMonth: string; defaultServiceDate: string; periodQuery: string }) {
  const vehiclesText = Array.from(new Set(route.assignments.map((assignment: any) => assignment.vehicle.fleetNumber))).join(", ");
  const completedCount = route.assignments.filter((assignment: any) => assignment.serviceDate <= endOfToday).length;
  const returnTo = `/transitos/projects?project=${project.id}&route=${route.id}&${periodQuery}`;
  return (
    <article className={`route-card selectable-card ${selected ? "selected" : ""}`}>
      <div className="record-head">
        <a className="route-card-link" href={`/transitos/projects?project=${project.id}&route=${route.id}&${periodQuery}`}>
          <h3 style={{ margin: 0 }}>{route.name}</h3>
          <p className="muted">{route.startPoint} → {route.endPoint}</p>
          <div className="chip-row">
            <span className="badge green">✓ {completedCount} taşındı</span>
            <span className="badge yellow">◷ {route.assignments.length - completedCount} plan</span>
          </div>
          {vehiclesText ? <p className="muted">Bağlı araçlar: {vehiclesText}</p> : <p className="muted">Henüz araç bağlı değil.</p>}
        </a>
        <div className="toolbar">
          {canEdit ? (
            <InlineDisclosureMenu label="..." tone="blue">
              <ModalAction label="Düzenle" title={`${route.name} İşlemleri`}>
                <div className="stack">
                  <form className="stack" action={updateRoute}>
                    <input type="hidden" name="id" value={route.id} />
                    <input type="hidden" name="_returnTo" value={returnTo} />
                    <RouteFields route={route} />
                    <div className="actions"><SubmitButton>✓ Güzergahı Güncelle</SubmitButton></div>
                  </form>
                  <form className="actions" action={deleteRoute}>
                    <input type="hidden" name="id" value={route.id} />
                    <input type="hidden" name="_returnTo" value={`/transitos/projects?project=${project.id}`} />
                    <DeleteButton>Güzergahı Sil</DeleteButton>
                  </form>
                </div>
              </ModalAction>
            </InlineDisclosureMenu>
          ) : null}
        </div>
      </div>

      {selected ? (
        <>
          <section className="service-planner section">
            <div>
              <span className="badge blue">Seçili güzergah</span>
              <h3>Servis planı ve ücretlendirme</h3>
              <p className="muted">Her servis kendi gününü, aracını, servis türünü ve iki ayrı ücretini saklar. Böylece proje faturası ve taşıyıcı hakedişi karışmadan hesaplanır.</p>
            </div>
            {canEdit ? (
              <div className="service-action-grid">
                <QuickCreateCard title="Tek gün servis" body="Seçili güne tek servis veya aynı gün tekrar ekleyin.">
                  <ModalAction label="Servis Ekle" title="Servis Ekle">
                    <form className="stack service-form" action={createAssignment}>
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="routeId" value={route.id} />
                      <input type="hidden" name="_returnTo" value={returnTo} />
                      <AssignmentFields vehicles={vehicles} defaultDate={defaultServiceDate} />
                      <div className="actions"><SubmitButton>✓ Servis Ekle</SubmitButton></div>
                    </form>
                  </ModalAction>
                </QuickCreateCard>
                <QuickCreateCard title="Çoklu gün planı" body="Ay tablosundan birden fazla günü seçerek plan oluşturun.">
                  <ModalAction label="Toplu Planla" title="Çoklu Servis Planla">
                    <form className="stack service-form" action={createBulkAssignments}>
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="routeId" value={route.id} />
                      <input type="hidden" name="_returnTo" value={returnTo} />
                      <BulkAssignmentFields vehicles={vehicles} defaultMonth={periodMonth} />
                      <div className="actions"><SubmitButton>✓ Servisleri Planla</SubmitButton></div>
                    </form>
                  </ModalAction>
                </QuickCreateCard>
              </div>
            ) : null}
          </section>

          <ServiceLedger assignments={route.assignments} projectId={project.id} routeId={route.id} returnTo={returnTo} vehicles={vehicles} endOfToday={endOfToday} canEdit={canEdit} showMoney={showMoney} />
        </>
      ) : null}
    </article>
  );
}

function ServiceLedger({ assignments, projectId, routeId, returnTo, vehicles, endOfToday, canEdit, showMoney }: { assignments: any[]; projectId: string; routeId: string; returnTo: string; vehicles: any[]; endOfToday: Date; canEdit: boolean; showMoney: boolean }) {
  if (!assignments.length) {
    return <section className="service-ledger empty section"><p className="muted">Bu güzergaha henüz servis eklenmemiş.</p></section>;
  }

  return (
    <section className="service-ledger section" aria-label="Güzergah servis kayıtları">
      {assignments.map((assignment: any) => {
        const isCompleted = assignment.serviceDate <= endOfToday;
        const carrierTotal = Number(assignment.pricePerService) * assignment.serviceCount;
        const clientTotal = Number(assignment.clientPricePerService) * assignment.serviceCount;
        return (
          <article className={`service-ledger-card ${directionRowClass(assignment.direction)}`} key={assignment.id}>
            <div className="service-ledger-main">
              <span className={directionBadgeClass(assignment.direction)}>{serviceDirectionTitle(assignment.direction)}</span>
              <strong>{assignment.serviceDate.toLocaleDateString("tr-TR")} · {assignment.serviceTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</strong>
              <small>{assignment.vehicle.fleetNumber} · {assignment.vehicle.plateNumber}</small>
            </div>
            <div className="service-ledger-status">
              {isCompleted ? <span className="badge green">✓ Taşındı</span> : <span className="badge yellow">◷ Planlandı</span>}
              <span className="badge gray">{assignment.serviceCount} servis</span>
            </div>
            {showMoney ? (
              <div className="service-ledger-money">
                <span><small>Taşıyıcı</small><strong>{formatTRY(carrierTotal)}</strong><em>{formatTRY(Number(assignment.pricePerService))} / servis</em></span>
                <span><small>Proje</small><strong>{formatTRY(clientTotal)}</strong><em>{formatTRY(Number(assignment.clientPricePerService))} / servis</em></span>
              </div>
            ) : null}
            {canEdit ? (
              <div className="service-ledger-actions">
                <ModalAction label="Düzenle" title="Servisi Düzenle">
                  <form className="stack service-form" action={updateAssignment}>
                    <input type="hidden" name="id" value={assignment.id} />
                    <input type="hidden" name="projectId" value={projectId} />
                    <input type="hidden" name="routeId" value={routeId} />
                    <input type="hidden" name="_returnTo" value={returnTo} />
                    <AssignmentEditFields assignment={assignment} vehicles={vehicles} />
                    <div className="actions"><SubmitButton>✓ Güncelle</SubmitButton></div>
                  </form>
                </ModalAction>
                <ModalAction label="Sil" title="Servis Sil" tone="danger">
                  <form className="stack" action={deleteAssignment} data-confirm-danger="true">
                    <input type="hidden" name="id" value={assignment.id} />
                    <input type="hidden" name="_returnTo" value={returnTo} />
                    <p>Bu servis kaydı silinecek. Emin misiniz?</p>
                    <div className="actions"><DeleteButton>Sil</DeleteButton></div>
                  </form>
                </ModalAction>
              </div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

function ProjectFields({ project, projectOwners }: { project?: any; projectOwners: { id: string; displayName: string; loginId: string }[] }) {
  const selectedOwnerIds = new Set((project?.ownerUsers ?? []).map((item: any) => item.id));
  return (
    <>
      <Field label="Proje adı" hint="İç takipte görünen ad."><input name="name" defaultValue={project?.name ?? ""} required /></Field>
      <Field label="Proje şirketi" hint="Hizmet verilen şirket."><input name="clientCompany" defaultValue={project?.clientCompany ?? ""} required /></Field>
      <Field label="Personel" hint="Taşınacak toplam personel."><input name="personnelCount" type="number" defaultValue={project?.personnelCount ?? 0} /></Field>
      <Field label="Durum" hint="Planlama, aktif veya tamamlandı.">
        <select name="status" defaultValue={project?.status ?? "PLANNING"}>
          <option value="PLANNING">Planlama</option>
          <option value="ACTIVE">Aktif</option>
          <option value="COMPLETED">Tamamlandı</option>
          <option value="PASSIVE">Pasif</option>
        </select>
      </Field>
      <Field label="Proje sahibi" hint="Bu kişiler sadece kendi proje/fatura detaylarını görür.">
        <div className="checkbox-grid">
          {projectOwners.map((owner) => (
            <label key={owner.id}>
              <input type="checkbox" name="ownerUserIds" value={owner.id} defaultChecked={selectedOwnerIds.has(owner.id)} />
              <span>{owner.displayName}<small>{owner.loginId}</small></span>
            </label>
          ))}
          {projectOwners.length === 0 ? <small className="muted">Önce Ayarlar panelinden Proje Sahibi kullanıcısı ekleyin.</small> : null}
        </div>
      </Field>
    </>
  );
}

function RouteFields({ route }: { route?: any }) {
  return (
    <>
      <Field label="Güzergah adı" hint="Kartlarda ve raporlarda görünen ad."><input name="name" defaultValue={route?.name ?? ""} required /></Field>
      <Field label="Başlangıç" hint="Çıkış noktası."><input name="startPoint" defaultValue={route?.startPoint ?? ""} required /></Field>
      <Field label="Bitiş" hint="Varış noktası."><input name="endPoint" defaultValue={route?.endPoint ?? ""} required /></Field>
    </>
  );
}

function AssignmentFields({ vehicles, defaultDate }: { vehicles: { id: string; fleetNumber: string; plateNumber: string }[]; defaultDate: string }) {
  return (
    <>
      <Field label="Aylık tablo" hint="Uygulamadaki gibi ay içinden tek gün seçin.">
        <MonthCalendarSelector name="serviceDate" mode="single" defaultDate={defaultDate} />
      </Field>
      <Field label="Saat" hint="Timeline’da görünecek saat."><input name="serviceTime" type="time" defaultValue="07:30" required /></Field>
      <AssignmentOptions vehicles={vehicles} />
    </>
  );
}

function AssignmentEditFields({ assignment, vehicles }: { assignment: any; vehicles: { id: string; fleetNumber: string; plateNumber: string }[] }) {
  return (
    <>
      <Field label="Gün" hint="Servisin yapılacağı tarih."><MonthCalendarSelector name="serviceDate" mode="single" defaultDate={dateInputValue(assignment.serviceDate)} /></Field>
      <Field label="Saat" hint="Timeline’da görünecek saat."><input name="serviceTime" type="time" defaultValue={timeInputValue(assignment.serviceTime) ?? "07:30"} required /></Field>
      <Field label="Araç" hint="Bu servise gidecek araç.">
        <select name="vehicleId" defaultValue={assignment.vehicleId} required>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.fleetNumber} · {vehicle.plateNumber}</option>)}</select>
      </Field>
      <Field label="İş türü" hint="Sabah, akşam, gece veya mesai.">
        <ServiceDirectionSelector defaultValue={assignment.direction} />
      </Field>
      <Field label="Servis adedi" hint="O gün yapılacak servis sayısı."><AdaptiveSlider name="serviceCount" label="Servis sayısı" min={1} max={20} defaultValue={assignment.serviceCount ?? 1} helper="Gerekirse rakamı kayıt sonrası düzenleyebilirsiniz." /></Field>
      <Field label="Taşıyıcı hakedişi" hint="Bu servisin taşeron servis başı TL tutarı."><FloatingInput name="pricePerService" label="₺ Taşıyıcı servis başı" defaultValue={Number(assignment.pricePerService ?? 0)} inputMode="decimal" /></Field>
      <Field label="Proje fatura tutarı" hint="Bu servisin proje sahibine servis başı TL tutarı."><FloatingInput name="clientPricePerService" label="₺ Proje servis başı" defaultValue={Number(assignment.clientPricePerService ?? 0)} inputMode="decimal" /></Field>
    </>
  );
}

function AssignmentOptions({ vehicles }: { vehicles: { id: string; fleetNumber: string; plateNumber: string }[] }) {
  return (
    <>
      <div className="pricing-note">
        <strong>Ücret bu servis kaydında belirlenir.</strong>
        <span>Her servis kendi taşıyıcı hakedişini ve proje sahibi fatura tutarını saklar.</span>
      </div>
      <Field label="Araç" hint="Bu servise gidecek araç.">
        <select name="vehicleId" required>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.fleetNumber} · {vehicle.plateNumber}</option>)}</select>
      </Field>
      <Field label="İş türü" hint="Proje güzergahları için sabah, akşam, gece veya mesai seçilir. Tek seferlik işler ayrı panelden eklenir.">
        <ServiceDirectionSelector />
      </Field>
      <Field label="Servis adedi" hint="O gün yapılacak servis sayısı."><AdaptiveSlider name="serviceCount" label="Servis sayısı" min={1} max={20} defaultValue={1} helper="Tek servis için 1, aynı gün tekrar için artırın." /></Field>
      <Field label="Taşıyıcı hakedişi" hint="Bu servisin taşeron servis başı TL tutarı."><FloatingInput name="pricePerService" label="₺ Taşıyıcı servis başı" defaultValue="0" inputMode="decimal" /></Field>
      <Field label="Proje fatura tutarı" hint="Bu servisin proje sahibine servis başı TL tutarı."><FloatingInput name="clientPricePerService" label="₺ Proje servis başı" defaultValue="0" inputMode="decimal" /></Field>
    </>
  );
}

function BulkAssignmentFields({ vehicles, defaultMonth }: { vehicles: { id: string; fleetNumber: string; plateNumber: string }[]; defaultMonth: string }) {
  return (
    <>
      <p className="muted">Ay tablosunda tıkladığınız günler planlanır; sürükleyerek aralık seçebilirsiniz. Hakediş ve fatura yalnızca tarihi gelen taşınmış servislerden hesaplanır.</p>
      <Field label="Aylık tablo" hint="Seçilen her gün için servis kaydı oluşturulur.">
        <MonthCalendarSelector name="serviceDates" mode="multiple" defaultMonth={defaultMonth} />
      </Field>
      <Field label="Saat" hint="Oluşturulacak servislerin saati."><input name="serviceTime" type="time" defaultValue="07:30" required /></Field>
      <AssignmentOptions vehicles={vehicles} />
    </>
  );
}

function OneOffFields({
  vehicles,
  route,
  assignment
}: {
  vehicles: { id: string; fleetNumber: string; plateNumber: string }[];
  route?: any;
  assignment?: any;
}) {
  return (
    <>
      <Field label="İş adı" hint="Tek seferlik iş kartında görünecek ad."><input name="name" defaultValue={route?.name ?? "Tek seferlik iş"} required /></Field>
      <Field label="Başlangıç" hint="Çıkış noktası."><input name="startPoint" defaultValue={route?.startPoint ?? ""} required /></Field>
      <Field label="Bitiş" hint="Varış noktası."><input name="endPoint" defaultValue={route?.endPoint ?? ""} required /></Field>
      <Field label="Gün" hint="İşin yapılacağı tarih."><input name="serviceDate" type="date" defaultValue={dateInputValue(assignment?.serviceDate)} required /></Field>
      <Field label="Saat" hint="Servis başlangıç saati."><input name="serviceTime" type="time" defaultValue={timeInputValue(assignment?.serviceTime) ?? "07:30"} required /></Field>
      <Field label="Araç" hint="Bu işe yönlendirilecek araç.">
        <select name="vehicleId" defaultValue={assignment?.vehicleId} required>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.fleetNumber} · {vehicle.plateNumber}</option>)}</select>
      </Field>
      <Field label="Servis adedi" hint="Bu işte yapılacak servis sayısı."><AdaptiveSlider name="serviceCount" label="Servis sayısı" min={1} max={20} defaultValue={assignment?.serviceCount ?? 1} /></Field>
      <div className="form-section-title">
        <strong>Tek Seferlik İş Ücretleri</strong>
        <small>Bu iş kendi güzergah kartı gibi saklanır; servis kaydı bu fiyatları kullanır.</small>
      </div>
      <Field label="Taşıyıcı hakediş fiyatı" hint="Servis başına TL."><FloatingInput name="pricePerService" label="₺ Taşıyıcı servis başı" defaultValue={assignment ? Number(assignment.pricePerService) : 0} inputMode="decimal" /></Field>
      <Field label="Proje sahibi fatura fiyatı" hint="Müşteriye servis başı TL."><FloatingInput name="clientPricePerService" label="₺ Proje servis başı" defaultValue={assignment ? Number(assignment.clientPricePerService ?? 0) : 0} inputMode="decimal" /></Field>
    </>
  );
}

function OneOffJobsPanel({ routes, vehicles, canEdit }: { routes: any[]; vehicles: { id: string; fleetNumber: string; plateNumber: string }[]; canEdit: boolean }) {
  return (
    <section className="card section">
      <div className="record-head">
        <div>
          <h2 style={{ marginTop: 0 }}>Tek Seferlik İşler</h2>
          <p className="muted">Projeye bağlı olmayan bağımsız işler burada görüntülenir.</p>
        </div>
        <span className="badge gray">{routes.length} iş</span>
      </div>

      {routes.length === 0 ? (
        <p className="muted">Henüz tek seferlik iş eklenmedi.</p>
      ) : (
        <div className="grid section">
          {routes.map((route) => {
            const assignment = route.assignments[0];
            return (
              <article className="card one-off-row" key={route.id}>
                <div className="record-head">
                  <div>
                    <h3 style={{ margin: 0 }}>{route.name}</h3>
                    <p className="muted">{route.startPoint} → {route.endPoint}</p>
                  </div>
                  {canEdit ? <ModalAction label="..." title={`${route.name} İşlemleri`}>
                    <div className="stack">
                      <form className="stack" action={updateOneOffJob}>
                        <input type="hidden" name="routeId" value={route.id} />
                        <input type="hidden" name="assignmentId" value={assignment?.id ?? ""} />
                        <input type="hidden" name="_returnTo" value="/transitos/projects" />
                        <OneOffFields vehicles={vehicles} route={route} assignment={assignment} />
                        <div className="actions"><SubmitButton>✓ Güncelle</SubmitButton></div>
                      </form>
                      <form className="stack" action={deleteOneOffJob}>
                        <input type="hidden" name="routeId" value={route.id} />
                        <input type="hidden" name="_returnTo" value="/transitos/projects" />
                        <p>Bu tek seferlik iş silinecek.</p>
                        <div className="actions"><DeleteButton>Sil</DeleteButton></div>
                      </form>
                    </div>
                  </ModalAction> : null}
                </div>
                {assignment ? (
                  <p className="muted">
                    {assignment.serviceDate.toLocaleDateString("tr-TR")} · {assignment.serviceTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} · {assignment.vehicle.fleetNumber}
                  </p>
                ) : (
                  <p className="muted">Araç/servis kaydı yok.</p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function defaultDateForPeriod(month: string) {
  const today = new Date();
  const todayMonth = today.toISOString().slice(0, 7);
  if (month === todayMonth) return today.toISOString().slice(0, 10);
  return `${month}-01`;
}

function dateInputValue(date?: Date) {
  if (!date) return undefined;
  return date.toISOString().slice(0, 10);
}

function ServiceDirectionSelector({ defaultValue = "MORNING" }: { defaultValue?: string }) {
  return (
    <FrequencySelector
      name="direction"
      label="Servis türü"
      defaultValue={defaultValue}
      options={[
        { value: "MORNING", label: "Sabah", tone: "green" },
        { value: "EVENING", label: "Akşam", tone: "blue" },
        { value: "NIGHT", label: "Gece", tone: "gray" },
        { value: "OVERTIME", label: "Mesai", tone: "red" }
      ]}
    />
  );
}

function timeInputValue(date?: Date) {
  if (!date) return undefined;
  return date.toISOString().slice(11, 16);
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return (
    <article className="card metric">
      <span className="muted">{title}</span>
      <strong>{value}</strong>
    </article>
  );
}

function statusClass(value: string) {
  if (value === "ACTIVE") return "badge green";
  if (value === "PASSIVE") return "badge gray";
  if (value === "COMPLETED") return "badge gray";
  if (value === "MAINTENANCE") return "badge red";
  return "badge yellow";
}

function statusTitle(value: string) {
  if (value === "ACTIVE") return "Aktif";
  if (value === "PASSIVE") return "Pasif";
  if (value === "COMPLETED") return "Tamamlandı";
  if (value === "MAINTENANCE") return "Bakımda";
  return "Planlama";
}

function directionRowClass(value: string) {
  if (value === "OVERTIME") return "extra-row";
  if (value === "ONE_OFF") return "one-off-row";
  if (value === "NIGHT") return "night-row";
  return "";
}

function directionBadgeClass(value: string) {
  if (value === "OVERTIME") return "badge red";
  if (value === "ONE_OFF") return "badge gray";
  if (value === "NIGHT") return "badge blue";
  return "badge green";
}
