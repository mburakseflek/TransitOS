import { Bus, CalendarDays, Clock3, FolderKanban, MapPinned, Users } from "lucide-react";
import { AppShell } from "@/app/components/AppShell";
import { CalendarMiniPanel, OnboardingScreen, RegistryStatusPills } from "@/app/components/RegistryInterfaceKit";
import { YandexTrafficMap } from "@/app/components/YandexTrafficMap";
import { prisma } from "@/lib/db";
import { serviceDirectionTitle } from "@/lib/labels";
import { getTrafficSnapshot, getYandexMapKitApiKey, istanbulTrafficMapEmbedUrl } from "@/lib/traffic";
import { cookies } from "next/headers";
import { readSessionToken } from "@/lib/auth";
import {
  assignmentAccessWhere,
  isProjectOwner,
  isSubcontractor,
  projectAccessWhere,
  vehicleAccessWhere
} from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const sessionCookie = (await cookies()).get("transitos_session")?.value;
  const user = sessionCookie ? await readSessionToken(sessionCookie).catch(() => null) : null;
  const subcontractorView = isSubcontractor(user);
  const projectOwnerView = isProjectOwner(user);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const vehicleScope = vehicleAccessWhere(user);
  const assignmentScope = assignmentAccessWhere(user);
  const projectScope = projectAccessWhere(user);

  const [subcontractors, vehicles, activeProjects, todayAssignments, completedAssignments, trafficSnapshot] = await Promise.all([
    projectOwnerView || subcontractorView ? Promise.resolve(0) : prisma.subcontractor.count(),
    prisma.vehicle.count({ where: vehicleScope }),
    prisma.project.count({ where: { status: "ACTIVE", ...projectScope } }),
    prisma.serviceAssignment.findMany({
      where: { serviceDate: { gte: today, lt: tomorrow }, ...assignmentScope },
      include: { route: true, vehicle: true, project: true },
      orderBy: { serviceTime: "asc" }
    }),
    prisma.serviceAssignment.findMany({
      where: { serviceDate: { lt: tomorrow }, ...assignmentScope },
      include: { route: true, vehicle: true, project: true },
      orderBy: { serviceDate: "desc" },
      take: 12
    }),
    getTrafficSnapshot()
  ]);
  const trafficItems = trafficSnapshot.items;
  const yandexApiKey = getYandexMapKitApiKey();

  return (
    <AppShell active="/dashboard" title="Ana Panel" subtitle="SeflekTur TransitOS Cloud v2.0 ortak veri merkezi">
      <div className="grid">
        {!projectOwnerView && !subcontractorView ? <Metric title="Taşeronlar" value={subcontractors} icon={<Users size={22} />} /> : null}
        <Metric title="Araçlar" value={vehicles} icon={<Bus size={22} />} />
        <Metric title="Aktif Projeler" value={activeProjects} icon={<FolderKanban size={22} />} />
        <Metric title="Bugünkü Servis" value={todayAssignments.length} icon={<CalendarDays size={22} />} />
      </div>

      <OnboardingScreen
        eyebrow="Günlük Operasyon"
        title="Bugünün akışı net, kısa ve rol bazlı görünür."
        body="Panel artık liste kalabalığı yerine yaklaşan servis, trafik ve aktif operasyon durumunu öne çıkarır."
        compact
        steps={[
          { title: "Servis timeline", body: "Bugünün servisleri saat sırasına göre görüntülenir." },
          { title: "Canlı trafik", body: "İstanbul trafik haritası ve yoğunluk bölgeleri ayrı modülde yer alır." },
          { title: "Rol bazlı özet", body: "Taşeron ve proje sahibi sadece kendi kapsamındaki kayıtları görür." }
        ]}
      />

      {subcontractorView ? (
        <section className="card section">
          <h2 style={{ marginTop: 0 }}>Gidilmiş İşlerim</h2>
          <table className="table">
            <thead><tr><th>Tarih</th><th>Saat</th><th>Proje</th><th>Güzergah</th><th>Araç</th><th>Tür</th></tr></thead>
            <tbody>
              {completedAssignments.map((service) => (
                <tr key={service.id}>
                  <td>{service.serviceDate.toLocaleDateString("tr-TR")}</td>
                  <td>{service.serviceTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td>{service.project?.name ?? "Tek seferlik iş"}</td>
                  <td>{service.route.name}</td>
                  <td>{service.vehicle.fleetNumber}</td>
                  <td><span className={directionBadgeClass(service.direction)}>{serviceDirectionTitle(service.direction)}</span></td>
                </tr>
              ))}
              {completedAssignments.length === 0 ? <tr><td colSpan={6}>Henüz gidilmiş iş yok.</td></tr> : null}
            </tbody>
          </table>
        </section>
      ) : projectOwnerView ? (
        <section className="card section">
          <div className="record-head">
            <div>
              <h2 style={{ marginTop: 0 }}>Proje Sahibi Özeti</h2>
              <p className="muted">Kendi projeleriniz, güzergahlarınız, tahsis edilen araç/şoförler ve fatura detayları görüntülenir.</p>
            </div>
            <span className="badge blue">Müşteri görünümü</span>
          </div>
        </section>
      ) : (
        <section className="card section">
          <div className="record-head">
            <div>
              <h2 style={{ marginTop: 0 }}>Yönetici Özeti</h2>
              <p className="muted">Detaylı plan, rota, gider ve hakediş verileri kendi panellerinde görüntülenir.</p>
            </div>
            <span className="badge green">Aktif</span>
          </div>
        </section>
      )}

      <section className="dashboard-columns section">
        <article className="card">
          <div className="record-head">
            <div>
              <h2 style={{ marginTop: 0 }}>Bugünkü Servis Timeline</h2>
              <p className="muted">Günün sıradaki servisleri ve araç bağlantıları.</p>
            </div>
            <Clock3 color="var(--cyan)" />
          </div>
          <div className="timeline-list section">
            {todayAssignments.map((service) => (
              <CalendarMiniPanel
                key={service.id}
                title={`${service.serviceTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} · ${service.route.name}`}
                body={`${service.project?.name ?? "Tek seferlik iş"} · ${service.vehicle.fleetNumber} · ${serviceDirectionTitle(service.direction)}`}
              />
            ))}
            {todayAssignments.length === 0 ? <p className="muted">Bugün için planlanmış servis görünmüyor.</p> : null}
          </div>
        </article>

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
            apiKey={yandexApiKey}
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

      <section className="card section">
        <div className="record-head">
          <div>
            <h2 style={{ marginTop: 0 }}>Operasyon Notları</h2>
            <p className="muted">Web sürümünde yapay zeka paneli kapalıdır; kritik takipler net operasyon kartlarıyla gösterilir.</p>
          </div>
          <span className="badge green">Aktif takip</span>
        </div>
        <div className="grid section">
          <article className="card metric"><span className="muted">Bugünkü yoğunluk</span><strong>{todayAssignments.length}</strong><small className="muted">Servis timeline’da görüntülenir.</small></article>
          <article className="card metric"><span className="muted">Rota kontrolü</span><strong>Google</strong><small className="muted">Duraklı rota linkleri rota panelinde.</small></article>
          <article className="card metric"><span className="muted">Hakediş</span><strong>Aylık</strong><small className="muted">Yalnız tamamlanan günler hesaplanır.</small></article>
          <article className="card metric"><span className="muted">Gece servisi</span><strong>Aktif</strong><small className="muted">Sabah, akşam, gece ve mesai ayrı izlenir.</small></article>
        </div>
      </section>
    </AppShell>
  );
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

function directionBadgeClass(value: string) {
  if (value === "OVERTIME") return "badge red";
  if (value === "ONE_OFF") return "badge gray";
  if (value === "NIGHT") return "badge blue";
  return "badge green";
}
