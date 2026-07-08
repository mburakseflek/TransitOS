import { cookies } from "next/headers";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { AppShell, DeleteButton, Field, ModalAction, SubmitButton } from "@/app/components/AppShell";
import { ProjectJumpLink, ProjectPanel, ProjectSelectionProvider } from "@/app/components/ProjectJumpLink";
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
  deleteAssignmentGroup,
  deleteOneOffJob,
  deleteProject,
  deleteRoute,
  updateAssignmentGroup,
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
  const requestedProjectId = params?.project ?? null;
  const initialProjectId = projects.some((project) => project.id === requestedProjectId)
    ? requestedProjectId
    : projects[0]?.id ?? null;
  const initialRouteId = params?.route ?? null;

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
      <ProjectSelectionProvider initialProjectId={initialProjectId}>
        <div className="project-layout project-selection-layout section">
          <aside className="card project-list">
            <h2 style={{ marginTop: 0 }}>Projeler</h2>
            <div className="stack">
              {projects.map((project) => (
                <ProjectJumpLink className="route-card selectable-card project-jump-card" projectId={project.id} key={project.id}>
                  <div className="record-head">
                    <strong>{project.name}</strong>
                    <span className={statusClass(project.status)}>{statusTitle(project.status)}</span>
                  </div>
                  <p className="muted">{project.clientCompany}</p>
                  <p className="muted">{project.personnelCount} personel · {project.routes.length} güzergah</p>
                </ProjectJumpLink>
              ))}
              {projects.length === 0 ? <p className="muted">Henüz proje yok.</p> : null}
            </div>
          </aside>

          <section className="stack project-detail-stack">
            {projects.map((project) => (
              <ProjectPanel projectId={project.id} key={project.id}>
                <ProjectCard project={project} initialRouteId={initialProjectId === project.id ? initialRouteId : null} vehicles={vehicles} projectOwners={projectOwners} endOfToday={endOfToday} canEdit={canEdit} showMoney={canEdit} periodMonth={period.month} defaultServiceDate={defaultServiceDate} periodQuery={`month=${period.month}&range=${period.range}`} />
              </ProjectPanel>
            ))}
            {projects.length === 0 ? <section className="card muted">Başlamak için Proje Ekle penceresini kullanın.</section> : null}
          </section>
        </div>
      </ProjectSelectionProvider>

      <OneOffJobsPanel routes={oneOffRoutes} vehicles={vehicles} canEdit={canEdit} />
    </AppShell>
  );
}

function ProjectCard({ project, initialRouteId, vehicles, projectOwners, endOfToday, canEdit, showMoney, periodMonth, defaultServiceDate, periodQuery }: { project: any; initialRouteId: string | null; vehicles: any[]; projectOwners: any[]; endOfToday: Date; canEdit: boolean; showMoney: boolean; periodMonth: string; defaultServiceDate: string; periodQuery: string }) {
  const allAssignments = project.routes.flatMap((route: any) => route.assignments);
  const completedAssignments = allAssignments.filter((item: any) => item.serviceDate <= endOfToday);
  const totalServices = completedAssignments.reduce((sum: number, item: any) => sum + item.serviceCount, 0);
  const activeVehicles = new Set(project.routes.flatMap((route: any) => route.assignments.map((item: any) => item.vehicle.fleetNumber)));

  return (
    <section className="project-detail-panel" id={`project-detail-${project.id}`}>
      <div className="record-head">
        <div>
          <h2 style={{ margin: 0 }}>{project.name}</h2>
          <p className="muted">{project.clientCompany}</p>
        </div>
        <div className="toolbar">
          <span className={statusClass(project.status)}>{statusTitle(project.status)}</span>
          {canEdit ? <ModalAction
            label={<Pencil size={17} aria-hidden="true" />}
            ariaLabel={`${project.name} projesini düzenle`}
            buttonClassName="ghost icon-button"
            title={`${project.name} İşlemleri`}
          >
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
                <DeleteButton ariaLabel={`${project.name} projesini sil`}>
                  <Trash2 size={17} aria-hidden="true" />
                </DeleteButton>
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
          <RouteCard route={route} project={project} defaultOpen={initialRouteId === route.id} vehicles={vehicles} endOfToday={endOfToday} canEdit={canEdit} showMoney={showMoney} periodMonth={periodMonth} defaultServiceDate={defaultServiceDate} periodQuery={periodQuery} key={route.id} />
        ))}
        {project.routes.length === 0 ? <p className="muted">Bu projeye henüz güzergah eklenmemiş.</p> : null}
      </div>

      {!initialRouteId && project.routes.length > 0 ? (
        <p className="muted section">Mesai ve planları görmek için güzergah kartını açın. Sayfa yenilenmeden detaylar burada genişler.</p>
      ) : null}
    </section>
  );
}

function RouteCard({ route, project, defaultOpen, vehicles, endOfToday, canEdit, showMoney, periodMonth, defaultServiceDate, periodQuery }: { route: any; project: any; defaultOpen: boolean; vehicles: any[]; endOfToday: Date; canEdit: boolean; showMoney: boolean; periodMonth: string; defaultServiceDate: string; periodQuery: string }) {
  const vehiclesText = Array.from(new Set(route.assignments.map((assignment: any) => assignment.vehicle.fleetNumber))).join(", ");
  const completedCount = route.assignments.filter((assignment: any) => assignment.serviceDate <= endOfToday).length;
  const returnTo = `/transitos/projects?project=${project.id}&route=${route.id}&${periodQuery}`;
  return (
    <details className="route-card route-accordion selectable-card" open={defaultOpen}>
      <summary className="route-card-link route-summary">
        <div>
          <h3 style={{ margin: 0 }}>{route.name}</h3>
          <p className="muted">{route.startPoint} → {route.endPoint}</p>
          <div className="chip-row">
            <span className="badge green">✓ {completedCount} taşındı</span>
            <span className="badge yellow">◷ {route.assignments.length - completedCount} plan</span>
          </div>
          {vehiclesText ? <p className="muted">Bağlı araçlar: {vehiclesText}</p> : <p className="muted">Henüz araç bağlı değil.</p>}
        </div>
        <span className="route-summary-cue" aria-hidden="true">⌄</span>
      </summary>
      <div className="record-head route-card-toolbar">
        <span className="badge gray">Servis planı</span>
        <div className="toolbar">
          {canEdit ? (
            <InlineDisclosureMenu label={<MoreHorizontal size={17} aria-hidden="true" />} tone="blue">
              <ModalAction
                label={<Pencil size={17} aria-hidden="true" />}
                ariaLabel={`${route.name} güzergahını düzenle`}
                buttonClassName="ghost icon-button"
                title={`${route.name} İşlemleri`}
              >
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
                    <DeleteButton ariaLabel={`${route.name} güzergahını sil`}>
                      <Trash2 size={17} aria-hidden="true" />
                    </DeleteButton>
                  </form>
                </div>
              </ModalAction>
            </InlineDisclosureMenu>
          ) : null}
        </div>
      </div>

      <div className="route-expand-body">
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
      </div>
    </details>
  );
}

function ServiceLedger({ assignments, projectId, routeId, returnTo, vehicles, endOfToday, canEdit, showMoney }: { assignments: any[]; projectId: string; routeId: string; returnTo: string; vehicles: any[]; endOfToday: Date; canEdit: boolean; showMoney: boolean }) {
  if (!assignments.length) {
    return <section className="service-ledger empty section"><p className="muted">Bu güzergaha henüz servis eklenmemiş.</p></section>;
  }

  const groups = groupServiceAssignments(assignments, endOfToday);

  return (
    <section className="service-ledger service-summary-list section" aria-label="Güzergah servis özeti">
      <div className="service-summary-head">
        <div>
          <strong>Takvim ve servis özeti</strong>
          <p className="muted">Aynı araç, saat, servis türü ve ücretler tek satırda gruplanır.</p>
        </div>
        <span className="badge gray">{assignments.length} kayıt · {groups.length} özet</span>
      </div>

      {groups.map((group) => {
        const title = serviceDirectionTitle(group.direction);
        return (
          <article className={`service-summary-row ${directionRowClass(group.direction)}`} key={group.key}>
            <div className="service-summary-main">
              <div className="service-summary-title">
                <strong>{group.vehicle.fleetNumber}</strong>
                <span className={directionBadgeClass(group.direction)}>{title}</span>
                {group.completedServices > 0 ? <span className="badge green">✓ Taşındı</span> : <span className="badge yellow">◷ Planlandı</span>}
              </div>
              <p className="muted">
                {group.selectedDays} seçili gün · {group.completedDays} tamamlanan gün · {group.pendingDays} bekleyen gün · {formatServiceTime(group.serviceTime)}
              </p>
              {showMoney ? (
                <p className="muted service-summary-line">
                  {group.completedServices} tamamlanan servis · servis başı {formatTRY(group.carrierUnitPrice)} · hakediş {formatTRY(group.carrierCompleted)} / kalan {formatTRY(group.carrierPending)} / toplam {formatTRY(group.carrierTotal)}
                </p>
              ) : (
                <p className="muted service-summary-line">
                  {group.totalServices} toplam servis · {group.completedServices} taşındı · {group.pendingServices} planlandı
                </p>
              )}
            </div>
            {showMoney ? (
              <div className="service-summary-money">
                <span className="money-completed"><small>Taşınan</small><strong>{formatTRY(group.carrierCompleted)}</strong></span>
                <span className="money-pending"><small>Kalan</small><strong>{formatTRY(group.carrierPending)}</strong></span>
                <span className="money-total"><small>Toplam</small><strong>{formatTRY(group.carrierTotal)}</strong></span>
              </div>
            ) : null}
            {canEdit ? (
              <div className="service-summary-actions">
                <ModalAction
                  label={<MoreHorizontal size={17} aria-hidden="true" />}
                  ariaLabel={`${group.vehicle.fleetNumber} ${title} servislerini düzenle`}
                  title={`${group.vehicle.fleetNumber} ${title} Servisleri`}
                  buttonClassName="ghost icon-button service-summary-menu"
                >
                  <ServiceGroupDetails group={group} projectId={projectId} routeId={routeId} returnTo={returnTo} vehicles={vehicles} endOfToday={endOfToday} showMoney={showMoney} />
                </ModalAction>
              </div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

function ServiceGroupDetails({
  group,
  projectId,
  routeId,
  returnTo,
  vehicles,
  endOfToday,
  showMoney
}: {
  group: ServiceAssignmentGroup;
  projectId: string;
  routeId: string;
  returnTo: string;
  vehicles: { id: string; fleetNumber: string; plateNumber: string }[];
  endOfToday: Date;
  showMoney: boolean;
}) {
  const selectedDates = Array.from(new Set(group.assignments.map((assignment) => dateInputValue(assignment.serviceDate)).filter(Boolean) as string[])).sort();
  const firstAssignment = group.assignments[0];

  return (
    <div className="service-summary-detail">
      <div className="service-summary-detail-overview">
        <div>
          <span className={directionBadgeClass(group.direction)}>{serviceDirectionTitle(group.direction)}</span>
          <strong>{group.vehicle.fleetNumber} · {group.vehicle.plateNumber}</strong>
          <p className="muted">{group.selectedDays} gün · {group.completedDays} tamamlanan gün · {group.pendingDays} bekleyen gün · {formatServiceTime(group.serviceTime)}</p>
        </div>
        {showMoney ? (
          <div className="service-summary-detail-totals">
            <span className="money-completed"><small>Tamamlanan</small><strong>{formatTRY(group.carrierCompleted)}</strong></span>
            <span className="money-pending"><small>Kalan</small><strong>{formatTRY(group.carrierPending)}</strong></span>
            <span className="money-total"><small>Toplam</small><strong>{formatTRY(group.carrierTotal)}</strong></span>
          </div>
        ) : null}
      </div>

      <form className="stack service-form service-group-edit-form" action={updateAssignmentGroup} data-dirty-guard="true">
        {group.assignments.map((assignment) => <input key={assignment.id} type="hidden" name="assignmentIds" value={assignment.id} />)}
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="routeId" value={routeId} />
        <input type="hidden" name="_returnTo" value={returnTo} />
        <div className="service-group-edit-head">
          <div>
            <strong>Toplu servis düzenleme</strong>
            <p className="muted">Bu gruptaki gün, saat, araç, servis türü ve ücretleri birlikte güncellenir.</p>
          </div>
          <span className="badge blue">{selectedDates.length} gün</span>
        </div>
        <BulkGroupEditFields group={group} vehicles={vehicles} selectedDates={selectedDates} />
        <div className="service-group-edit-actions">
          <SubmitButton>✓ Toplu Güncelle</SubmitButton>
        </div>
      </form>

      <form className="service-group-danger" action={deleteAssignmentGroup} data-confirm-danger="true">
        {group.assignments.map((assignment) => <input key={assignment.id} type="hidden" name="assignmentIds" value={assignment.id} />)}
        <input type="hidden" name="_returnTo" value={returnTo} />
        <DeleteButton ariaLabel="Bu servis grubunu sil">
          <Trash2 size={17} aria-hidden="true" />
        </DeleteButton>
      </form>

      <div className="service-summary-detail-list">
        <div className="service-summary-detail-list-head">
          <strong>Tekil günler</strong>
          <span className="muted">Gerekirse yalnızca belirli bir günü silebilirsiniz.</span>
        </div>
        {group.assignments.map((assignment) => {
          const completed = assignment.serviceDate <= endOfToday;
          const carrierTotal = Number(assignment.pricePerService) * assignment.serviceCount;
          const clientTotal = Number(assignment.clientPricePerService) * assignment.serviceCount;
          return (
            <details className="service-summary-detail-card" key={assignment.id}>
              <summary>
                <span>
                  <strong>{assignment.serviceDate.toLocaleDateString("tr-TR")} · {formatServiceTime(assignment.serviceTime)}</strong>
                  <small>{assignment.serviceCount} servis · {assignment.vehicle.fleetNumber}</small>
                </span>
                <span className={completed ? "badge green" : "badge yellow"}>{completed ? "✓ Taşındı" : "◷ Planlandı"}</span>
                {showMoney ? <b>{formatTRY(carrierTotal)}</b> : null}
              </summary>
              {showMoney ? (
                <div className="service-summary-detail-money">
                  <span>Taşıyıcı: {formatTRY(carrierTotal)} · {formatTRY(Number(assignment.pricePerService))} / servis</span>
                  <span>Proje: {formatTRY(clientTotal)} · {formatTRY(Number(assignment.clientPricePerService))} / servis</span>
                </div>
              ) : null}
              <form className="service-summary-delete" action={deleteAssignment} data-confirm-danger="true">
                <input type="hidden" name="id" value={assignment.id} />
                <input type="hidden" name="_returnTo" value={returnTo} />
                <DeleteButton ariaLabel="Bu servisi sil">
                  <Trash2 size={17} aria-hidden="true" />
                </DeleteButton>
              </form>
            </details>
          );
        })}
        {!firstAssignment ? <p className="muted">Bu grupta servis kaydı bulunmuyor.</p> : null}
      </div>
    </div>
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

function BulkGroupEditFields({
  group,
  vehicles,
  selectedDates
}: {
  group: ServiceAssignmentGroup;
  vehicles: { id: string; fleetNumber: string; plateNumber: string }[];
  selectedDates: string[];
}) {
  return (
    <>
      <Field label="Çalışma takvimi" hint="Seçili günler bu servis grubuna ait kabul edilir. Çıkardığınız günler kayıttan silinir; eklediğiniz günler gruba eklenir.">
        <MonthCalendarSelector
          name="serviceDates"
          mode="multiple"
          defaultMonth={dateInputValue(group.firstDate)?.slice(0, 7)}
          defaultDates={selectedDates}
        />
      </Field>
      <div className="service-group-edit-grid">
        <Field label="Servis saati" hint="Seçili tüm günlerde kullanılacak saat.">
          <input name="serviceTime" type="time" defaultValue={timeInputValue(group.serviceTime) ?? "07:30"} required />
        </Field>
        <Field label="Araç" hint="Bu gruptaki servislerin tamamına atanacak araç.">
          <select name="vehicleId" defaultValue={group.vehicle?.id} required>
            {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.fleetNumber} · {vehicle.plateNumber}</option>)}
          </select>
        </Field>
        <Field label="İş türü" hint="Sabah, akşam, gece veya mesai ayrımı.">
          <ServiceDirectionSelector defaultValue={group.direction} />
        </Field>
        <Field label="Servis adedi" hint="Seçili her gün için yapılacak servis sayısı.">
          <AdaptiveSlider name="serviceCount" label="Servis sayısı" min={1} max={20} defaultValue={group.serviceCount} helper="Bu değer seçili günlerin tamamına uygulanır." />
        </Field>
        <Field label="Taşıyıcı hakedişi" hint="Taşerona servis başına yazılacak TL tutarı.">
          <FloatingInput name="pricePerService" label="₺ Taşıyıcı servis başı" defaultValue={group.carrierUnitPrice} inputMode="decimal" />
        </Field>
        <Field label="Proje fatura tutarı" hint="Proje sahibine servis başına yazılacak TL tutarı.">
          <FloatingInput name="clientPricePerService" label="₺ Proje servis başı" defaultValue={group.clientUnitPrice} inputMode="decimal" />
        </Field>
      </div>
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
                  {canEdit ? <ModalAction
                    label={<MoreHorizontal size={17} aria-hidden="true" />}
                    ariaLabel={`${route.name} tek seferlik iş işlemleri`}
                    buttonClassName="ghost icon-button"
                    title={`${route.name} İşlemleri`}
                  >
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
                        <div className="actions">
                          <DeleteButton ariaLabel={`${route.name} tek seferlik işi sil`}>
                            <Trash2 size={17} aria-hidden="true" />
                          </DeleteButton>
                        </div>
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

type ServiceAssignmentGroup = {
  key: string;
  direction: string;
  serviceTime: Date;
  vehicle: any;
  assignments: any[];
  serviceCount: number;
  selectedDays: number;
  completedDays: number;
  pendingDays: number;
  completedServices: number;
  pendingServices: number;
  totalServices: number;
  carrierUnitPrice: number;
  clientUnitPrice: number;
  carrierCompleted: number;
  carrierPending: number;
  carrierTotal: number;
  clientCompleted: number;
  clientPending: number;
  clientTotal: number;
  firstDate: Date;
};

function groupServiceAssignments(assignments: any[], endOfToday: Date): ServiceAssignmentGroup[] {
  const groups = new Map<string, ServiceAssignmentGroup>();
  const sortedAssignments = [...assignments].sort((first, second) => {
    const dateDiff = first.serviceDate.getTime() - second.serviceDate.getTime();
    if (dateDiff !== 0) return dateDiff;
    return first.serviceTime.getTime() - second.serviceTime.getTime();
  });

  sortedAssignments.forEach((assignment) => {
    const carrierUnitPrice = Number(assignment.pricePerService ?? 0);
    const clientUnitPrice = Number(assignment.clientPricePerService ?? 0);
    const serviceCount = Number(assignment.serviceCount ?? 1);
    const key = [
      assignment.vehicleId,
      assignment.direction,
      timeInputValue(assignment.serviceTime) ?? "",
      serviceCount,
      carrierUnitPrice,
      clientUnitPrice
    ].join("|");
    const completed = assignment.serviceDate <= endOfToday;
    const carrierValue = carrierUnitPrice * serviceCount;
    const clientValue = clientUnitPrice * serviceCount;
    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, {
        key,
        direction: assignment.direction,
        serviceTime: assignment.serviceTime,
        vehicle: assignment.vehicle,
        assignments: [assignment],
        serviceCount,
        selectedDays: 0,
        completedDays: 0,
        pendingDays: 0,
        completedServices: completed ? serviceCount : 0,
        pendingServices: completed ? 0 : serviceCount,
        totalServices: serviceCount,
        carrierUnitPrice,
        clientUnitPrice,
        carrierCompleted: completed ? carrierValue : 0,
        carrierPending: completed ? 0 : carrierValue,
        carrierTotal: carrierValue,
        clientCompleted: completed ? clientValue : 0,
        clientPending: completed ? 0 : clientValue,
        clientTotal: clientValue,
        firstDate: assignment.serviceDate
      });
      return;
    }

    existing.assignments.push(assignment);
    existing.completedServices += completed ? serviceCount : 0;
    existing.pendingServices += completed ? 0 : serviceCount;
    existing.totalServices += serviceCount;
    existing.carrierCompleted += completed ? carrierValue : 0;
    existing.carrierPending += completed ? 0 : carrierValue;
    existing.carrierTotal += carrierValue;
    existing.clientCompleted += completed ? clientValue : 0;
    existing.clientPending += completed ? 0 : clientValue;
    existing.clientTotal += clientValue;
  });

  return Array.from(groups.values())
    .map((group) => {
      const selectedDates = new Set(group.assignments.map((assignment) => dateInputValue(assignment.serviceDate)));
      const completedDates = new Set(group.assignments.filter((assignment) => assignment.serviceDate <= endOfToday).map((assignment) => dateInputValue(assignment.serviceDate)));
      const pendingDates = new Set(group.assignments.filter((assignment) => assignment.serviceDate > endOfToday).map((assignment) => dateInputValue(assignment.serviceDate)));
      return {
        ...group,
        selectedDays: selectedDates.size,
        completedDays: completedDates.size,
        pendingDays: pendingDates.size
      };
    })
    .sort((first, second) => {
      const dateDiff = first.firstDate.getTime() - second.firstDate.getTime();
      if (dateDiff !== 0) return dateDiff;
      const timeDiff = first.serviceTime.getTime() - second.serviceTime.getTime();
      if (timeDiff !== 0) return timeDiff;
      return `${first.vehicle.fleetNumber}`.localeCompare(`${second.vehicle.fleetNumber}`, "tr");
    });
}

function formatServiceTime(date?: Date) {
  if (!date) return "--:--";
  return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
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
