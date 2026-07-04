import { cookies } from "next/headers";
import { AppShell, DeleteButton, Field, ModalAction, SubmitButton } from "@/app/components/AppShell";
import { PeriodFilter } from "@/app/components/PeriodFilter";
import { PrintReportButton } from "@/app/components/PrintReportButton";
import { RoutePicker } from "@/app/components/RoutePicker";
import { InlineDisclosureMenu, ViewOnMap } from "@/app/components/RegistryInterfaceKit";
import { createStop, deleteStop, updateRoute } from "@/app/actions";
import { readSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serviceDirectionTitle } from "@/lib/labels";
import { parsePeriod, periodDateWhere } from "@/lib/period";
import { assignmentAccessWhere, canEditOperations, routeAccessWhere } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function RoutesPage({
  searchParams
}: {
  searchParams?: Promise<{ route?: string; month?: string; range?: string }>;
}) {
  const params = await searchParams;
  const period = parsePeriod(params);
  const sessionCookie = (await cookies()).get("transitos_session")?.value;
  const user = sessionCookie ? await readSessionToken(sessionCookie).catch(() => null) : null;
  const canEdit = canEditOperations(user);

  const routes = await prisma.serviceRoute.findMany({
    where: routeAccessWhere(user),
    include: {
      project: true,
      stops: { orderBy: { order: "asc" } },
      assignments: {
        where: { ...assignmentAccessWhere(user), serviceDate: periodDateWhere(period) },
        include: { vehicle: true },
        orderBy: [{ serviceDate: "asc" }, { serviceTime: "asc" }]
      }
    },
    orderBy: { name: "asc" }
  });

  const selectedRoute = routes.find((route) => route.id === params?.route) ?? routes[0] ?? null;

  return (
    <AppShell active="/transitos/routes" title="Rotalar" subtitle="Güzergah, durak, Google rota ve araç bağlantıları.">
      <PeriodFilter searchParams={params} hidden={{ route: params?.route }} />
      {routes.length === 0 ? (
        <section className="card muted">Rota için önce projeye güzergah ve araç planı ekleyin.</section>
      ) : (
        <section className="card route-workspace">
          <div className="record-head">
            <div>
              <h2 style={{ margin: 0 }}>Rota Seçimi</h2>
              <p className="muted">Uzun liste yerine çalışmak istediğiniz rotayı seçin.</p>
            </div>
            <RoutePicker
              routes={routes.map((route) => ({
                id: route.id,
                name: route.name,
                subtitle: route.project?.clientCompany ?? "Tek seferlik iş"
              }))}
              selectedRouteId={selectedRoute?.id}
              periodQuery={`month=${period.month}&range=${period.range}`}
            />
          </div>

          {selectedRoute ? <RouteDetail route={selectedRoute} canEdit={canEdit} /> : null}
        </section>
      )}
    </AppShell>
  );
}

function RouteDetail({ route, canEdit }: { route: any; canEdit: boolean }) {
  const reportId = `route-report-${route.id}`;
  return (
    <section className="section">
      <div className="record-head">
        <div>
          <h2 style={{ margin: 0 }}>{route.name}</h2>
          <p className="muted">{route.project?.clientCompany ?? "Tek seferlik iş"} · {route.startPoint} → {route.endPoint}</p>
          <div className="chip-row">
            <span className="badge green">{route.stops.length} durak</span>
            <span className="badge yellow">{route.assignments.length} araç planı</span>
          </div>
        </div>
        <div className="toolbar">
          <PrintReportButton targetId={reportId} label="Rota PDF / Yazdır" />
          <a className="ghost compact-button" href={googleMapsRouteUrl(route.stops)} target="_blank" rel="noreferrer">
            Google Rota
          </a>
          <a className="ghost compact-button" href={googleMapsTrafficUrl(route.stops)} target="_blank" rel="noreferrer">
            Canlı Trafik
          </a>
          {canEdit ? (
            <InlineDisclosureMenu label="..." tone="blue">
              <ModalAction label="Düzenle" title={`${route.name} İşlemleri`}>
                <form className="stack" action={updateRoute}>
                  <input type="hidden" name="id" value={route.id} />
                  <input type="hidden" name="_returnTo" value={`/transitos/routes?route=${route.id}`} />
                  <RouteFields route={route} />
                  <div className="actions"><SubmitButton>✓ Rotayı Güncelle</SubmitButton></div>
                </form>
              </ModalAction>
            </InlineDisclosureMenu>
          ) : null}
        </div>
      </div>

      <div className="route-detail-grid section">
        <div className="stack">
          <ViewOnMap
            title={`${route.name} haritası`}
            subtitle={`${route.stops.length} durak · Google sürüş rotası`}
            href={googleMapsRouteUrl(route.stops)}
          >
            <div className="map-box large-map">
              {route.stops.length === 0 ? (
                <div className="map-empty">Durak ekleyince harita burada gerçek harita olarak açılır.</div>
              ) : (
                <iframe
                  className="map-frame"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={googleMapsEmbedUrl(route.stops)}
                  title={`${route.name} haritası`}
                />
              )}
              {route.stops.map((stop: any, index: number) => (
                <div
                  className="pin"
                  key={stop.id}
                  style={{ left: `${16 + (index * 59) % 74}%`, top: `${20 + (index * 37) % 58}%` }}
                >
                  <span>{stop.order}. {stop.title}</span>
                </div>
              ))}
            </div>
          </ViewOnMap>

          <section className="card">
            <div className="record-head">
              <div>
                <h3 style={{ marginTop: 0 }}>Duraklar</h3>
                <p className="muted">Duraklar Google rota linkinde sıralı şekilde kullanılır.</p>
              </div>
              {canEdit ? <ModalAction label="Durak Ekle" title="Durak Ekle">
                <form className="stack" action={createStop}>
                  <input type="hidden" name="routeId" value={route.id} />
                  <input type="hidden" name="_returnTo" value={`/transitos/routes?route=${route.id}`} />
                  <StopFields order={route.stops.length + 1} />
                  <div className="actions"><SubmitButton>✓ Durak Ekle</SubmitButton></div>
                </form>
              </ModalAction> : null}
            </div>
            <table className="table">
              <thead><tr><th>Sıra</th><th>Durak</th><th>Konum</th><th></th></tr></thead>
              <tbody>
                {route.stops.map((stop: any) => (
                  <tr key={stop.id}>
                    <td>{stop.order}</td>
                    <td>{stop.title}</td>
                    <td>{Number(stop.latitude).toFixed(4)}, {Number(stop.longitude).toFixed(4)}</td>
                    <td>
                      {canEdit ? (
                      <ModalAction label="Sil" title="Durak Sil" tone="danger">
                        <form className="stack" action={deleteStop}>
                          <input type="hidden" name="id" value={stop.id} />
                          <input type="hidden" name="_returnTo" value={`/transitos/routes?route=${route.id}`} />
                          <p>{stop.title} durağı rotadan silinecek. Emin misiniz?</p>
                          <div className="actions"><DeleteButton>Sil</DeleteButton></div>
                        </form>
                      </ModalAction>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {route.stops.length === 0 ? <tr><td colSpan={4}>Haritaya durak ekleyin.</td></tr> : null}
              </tbody>
            </table>
          </section>
        </div>

        <aside className="card">
          <h3 style={{ marginTop: 0 }}>Bağlı Araçlar</h3>
          <div className="stack">
            {route.assignments.map((assignment: any) => (
              <div className="route-assignment-card" key={assignment.id}>
                <strong>{assignment.vehicle.fleetNumber} · {assignment.vehicle.plateNumber}</strong>
                <span className={directionBadgeClass(assignment.direction)}>{serviceDirectionTitle(assignment.direction)}</span>
                <p className="muted">
                  {assignment.serviceDate.toLocaleDateString("tr-TR")} · {assignment.serviceTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
            {route.assignments.length === 0 ? <p className="muted">Henüz araç bağlantısı yok.</p> : null}
          </div>
        </aside>
      </div>
      <RouteReport route={route} targetId={reportId} />
    </section>
  );
}

function RouteFields({ route }: { route: any }) {
  return (
    <>
      <Field label="Güzergah adı" hint="Rapor ve kart başlığı."><input name="name" defaultValue={route.name} /></Field>
      <Field label="Başlangıç" hint="Çıkış noktası."><input name="startPoint" defaultValue={route.startPoint} /></Field>
      <Field label="Bitiş" hint="Varış noktası."><input name="endPoint" defaultValue={route.endPoint} /></Field>
    </>
  );
}

function RouteReport({ route, targetId }: { route: any; targetId: string }) {
  return (
    <div className="invoice-paper section transitos-report route-print-report" id={targetId}>
      <div className="report-page">
        <header className="report-top">
          <div>
            <h1>SEFLEKTUR Transit<span>OS</span></h1>
            <p>Rota Planı</p>
            <small>{route.project?.clientCompany ?? "Tek seferlik iş"} · {route.name}</small>
          </div>
          <aside>
            <small>{new Date().toLocaleDateString("tr-TR")}</small>
            <small>{route.startPoint} → {route.endPoint}</small>
            <img src="/seflek-logo-white.png" alt="Seflek Tur" />
          </aside>
        </header>
        <h2 className="report-owner">{route.name}</h2>
        <div className="report-metrics">
          <article className="report-metric blue"><span>Durak</span><strong>{route.stops.length}</strong></article>
          <article className="report-metric green"><span>Plan</span><strong>{route.assignments.length}</strong></article>
          <article className="report-metric"><span>Başlangıç</span><strong>{route.startPoint}</strong></article>
          <article className="report-metric"><span>Bitiş</span><strong>{route.endPoint}</strong></article>
        </div>
        <div className="map-box route-report-map">
          {route.stops.length ? (
            <RouteReportMap stops={route.stops} />
          ) : <div className="map-empty">Durak eklenmedi.</div>}
        </div>
        <h2>Durak Sırası</h2>
        <table className="table">
          <thead><tr><th>Sıra</th><th>Durak</th><th>Koordinat</th></tr></thead>
          <tbody>
            {route.stops.map((stop: any) => (
              <tr key={stop.id}>
                <td>{stop.order}</td>
                <td>{stop.title}</td>
                <td>{Number(stop.latitude).toFixed(5)}, {Number(stop.longitude).toFixed(5)}</td>
              </tr>
            ))}
            {route.stops.length === 0 ? <tr><td colSpan={3}>Durak yok.</td></tr> : null}
          </tbody>
        </table>
        <footer className="report-footer">
          <span>SeflekTur TransitOS tarafından hazırlanmıştır.</span>
          <span>A4 yazdırma düzeni</span>
        </footer>
      </div>
    </div>
  );
}

function RouteReportMap({ stops }: { stops: { id: string; title: string; latitude: unknown; longitude: unknown; order: number }[] }) {
  const points = routeReportPoints(stops);
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="route-report-diagram" aria-label="Rota harita görüntüsü">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Rota çizgisi">
        <defs>
          <linearGradient id="routeLineGradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#17385f" />
            <stop offset="100%" stopColor="#d71920" />
          </linearGradient>
        </defs>
        <path d="M 0 80 C 22 64 28 48 46 55 S 72 50 100 24" fill="none" stroke="#dbe6f2" strokeWidth="10" strokeLinecap="round" opacity="0.82" />
        {points.length > 1 ? <polyline points={polyline} fill="none" stroke="url(#routeLineGradient)" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" /> : null}
      </svg>
      {points.map((point) => (
        <div className="route-report-pin" key={point.id} style={{ left: `${point.x}%`, top: `${point.y}%` }}>
          <b>{point.order}</b>
          <span>{point.title}</span>
        </div>
      ))}
    </div>
  );
}

function StopFields({ order }: { order: number }) {
  return (
    <>
      <Field label="Durak adı" hint="Harita üzerindeki iğne etiketi."><input name="title" required /></Field>
      <Field label="Enlem" hint="Latitude."><input name="latitude" defaultValue="41.0082" /></Field>
      <Field label="Boylam" hint="Longitude."><input name="longitude" defaultValue="28.9784" /></Field>
      <Field label="Sıra" hint="Rota üzerindeki durak sırası."><input name="order" type="number" defaultValue={order} /></Field>
    </>
  );
}

function directionBadgeClass(value: string) {
  if (value === "OVERTIME") return "badge red";
  if (value === "ONE_OFF") return "badge gray";
  if (value === "NIGHT") return "badge blue";
  return "badge green";
}

function googleMapsRouteUrl(stops: { latitude: unknown; longitude: unknown; order: number }[]) {
  const sortedStops = [...stops].sort((a, b) => a.order - b.order);
  if (sortedStops.length < 2) {
    return "https://www.google.com/maps";
  }
  const path = sortedStops
    .map((stop) => `${Number(stop.latitude)},${Number(stop.longitude)}`)
    .join("/");
  return `https://www.google.com/maps/dir/${path}/?travelmode=driving`;
}

function googleMapsEmbedUrl(stops: { latitude: unknown; longitude: unknown; order: number; title?: string }[]) {
  const sortedStops = [...stops].sort((a, b) => a.order - b.order);
  const center = sortedStops[0];
  if (!center) {
    return "about:blank";
  }
  if (sortedStops.length === 1) {
    const label = encodeURIComponent(center.title ?? "SeflekTur rota");
    return `https://maps.google.com/maps?q=${Number(center.latitude)},${Number(center.longitude)}(${label})&z=13&output=embed`;
  }
  const [start, ...rest] = sortedStops;
  const destinationPath = rest
    .map((stop) => `${Number(stop.latitude)},${Number(stop.longitude)}`)
    .join("+to:");
  return `https://maps.google.com/maps?saddr=${Number(start.latitude)},${Number(start.longitude)}&daddr=${destinationPath}&dirflg=d&output=embed`;
}

function googleMapsTrafficUrl(stops: { latitude: unknown; longitude: unknown; order: number }[]) {
  const sortedStops = [...stops].sort((a, b) => a.order - b.order);
  const center = sortedStops[0];
  const latitude = center ? Number(center.latitude) : 41.0082;
  const longitude = center ? Number(center.longitude) : 28.9784;
  return `https://www.google.com/maps/@${latitude},${longitude},12z/data=!5m1!1e1`;
}

function routeReportPoints(stops: { id: string; title: string; latitude: unknown; longitude: unknown; order: number }[]) {
  const sortedStops = [...stops].sort((a, b) => a.order - b.order);
  const coordinates = sortedStops.map((stop) => ({
    id: stop.id,
    title: stop.title,
    order: stop.order,
    latitude: Number(stop.latitude),
    longitude: Number(stop.longitude)
  }));
  const valid = coordinates.filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
  if (valid.length === 0) return [];
  const minLat = Math.min(...valid.map((point) => point.latitude));
  const maxLat = Math.max(...valid.map((point) => point.latitude));
  const minLon = Math.min(...valid.map((point) => point.longitude));
  const maxLon = Math.max(...valid.map((point) => point.longitude));
  const latRange = Math.max(maxLat - minLat, 0.001);
  const lonRange = Math.max(maxLon - minLon, 0.001);

  return valid.map((point, index) => ({
    id: point.id,
    title: point.title,
    order: point.order || index + 1,
    x: 8 + ((point.longitude - minLon) / lonRange) * 84,
    y: 12 + (1 - (point.latitude - minLat) / latRange) * 76
  }));
}
