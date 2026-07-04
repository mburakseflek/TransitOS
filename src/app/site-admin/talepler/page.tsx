import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, Building2, CarFront, FileText, Mail, Phone } from "lucide-react";
import { isManager, readSessionToken } from "@/lib/auth";
import { readJsonRecords } from "@/lib/site-content";

export default async function SiteRequestsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("transitos_session")?.value;
  const user = token ? await readSessionToken(token).catch(() => null) : null;

  if (!isManager(user)) {
    redirect("/login?next=/site-admin/talepler");
  }

  const [carriers, requests] = await Promise.all([
    readJsonRecords("carrier"),
    readJsonRecords("service")
  ]);

  return (
    <main className="admin-requests-page">
      <header className="admin-requests-topbar">
        <Link className="navy-brand" href="/site-admin">
          <img src="/brand/seflek-logo-navy.png" alt="Şeflek Tur" />
        </Link>
        <div>
          <Link className="ghost" href="/site-admin"><ArrowLeft size={16} /> Site düzenlemeye dön</Link>
          <Link className="new-primary" href="/seflektur">Siteyi görüntüle</Link>
        </div>
      </header>

      <section className="admin-requests-hero">
        <span className="new-eyebrow">Yönetici paneli</span>
        <h1>Hizmet ve taşımacı talepleri</h1>
        <p>Kurumsal siteden gelen tüm formlar burada listelenir. Yeni gelen başvurular en üstte görünür.</p>
        <div className="admin-request-stats">
          <article><strong>{requests.length}</strong><span>hizmet talebi</span></article>
          <article><strong>{carriers.length}</strong><span>taşımacı başvurusu</span></article>
        </div>
      </section>

      <section className="request-board">
        <RequestColumn title="Hizmet Talepleri" icon={<FileText size={22} />} records={requests} type="service" />
        <RequestColumn title="Taşımacı Başvuruları" icon={<CarFront size={22} />} records={carriers} type="carrier" />
      </section>
    </main>
  );
}

function RequestColumn({
  title,
  icon,
  records,
  type
}: {
  title: string;
  icon: ReactNode;
  records: Record<string, string>[];
  type: "service" | "carrier";
}) {
  return (
    <section className="request-column">
      <div className="request-column-head">
        {icon}
        <h2>{title}</h2>
        <span>{records.length} kayıt</span>
      </div>
      <div className="request-card-list">
        {records.map((record, index) => (
          <article className="request-card hover-card" key={`${record.createdAt}-${index}`}>
            <div className="request-card-head">
              <Building2 size={20} />
              <div>
                <strong>{record.companyName || record.contactPerson || "Yeni kayıt"}</strong>
                <span>{formatDate(record.createdAt)}</span>
              </div>
            </div>
            <dl>
              {type === "service" ? (
                <>
                  <div><dt>İletişim kişisi</dt><dd>{record.contactPerson || "-"}</dd></div>
                  <div><dt>Hizmet tipi</dt><dd>{record.serviceType || "-"}</dd></div>
                  <div><dt>Yolcu sayısı</dt><dd>{record.passengerCount || "-"}</dd></div>
                  <div className="wide"><dt>Güzergah</dt><dd>{record.routeInfo || "-"}</dd></div>
                </>
              ) : (
                <>
                  <div><dt>Yetkili</dt><dd>{record.authorizedPerson || "-"}</dd></div>
                  <div><dt>Bölge</dt><dd>{record.city || "-"}</dd></div>
                  <div><dt>Araç sayısı</dt><dd>{record.vehicleCount || "-"}</dd></div>
                  <div className="wide"><dt>Araç tipleri</dt><dd>{record.vehicleTypes || "-"}</dd></div>
                </>
              )}
              <div><dt>Telefon</dt><dd>{record.phone || "-"}</dd></div>
              <div><dt>E-posta</dt><dd>{record.email || "-"}</dd></div>
              <div className="wide"><dt>Not</dt><dd>{record.note || "-"}</dd></div>
            </dl>
            <div className="request-actions">
              {record.phone ? <a className="new-secondary" href={`tel:${record.phone}`}><Phone size={15} /> Ara</a> : null}
              {record.email ? <a className="new-secondary" href={`mailto:${record.email}`}><Mail size={15} /> Mail</a> : null}
            </div>
          </article>
        ))}
        {records.length === 0 ? <p className="request-empty">Henüz kayıt yok.</p> : null}
      </div>
    </section>
  );
}

function formatDate(value?: string) {
  if (!value) return "Tarih yok";
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
