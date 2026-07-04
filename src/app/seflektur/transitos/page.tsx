import Link from "next/link";
import { ArrowRight, BarChart3, FileText, Map, MonitorCog, ShieldCheck, UsersRound } from "lucide-react";
import { readSiteContent } from "@/lib/site-content";
import { MobileAppPromo, PageHero, SiteFooter, SiteHeader } from "@/app/seflektur/SiteChrome";

const features = [
  ["Taşeron ve araç yönetimi", "Firma, araç, sürücü ve evrak süreçleri tek merkezde düzenlenir.", UsersRound],
  ["Güzergah ve rota planlama", "Duraklar, rota kartları ve servis planları operasyon ekranında takip edilir.", Map],
  ["Hakediş ve gider raporları", "Aylık tamamlanan servisler, giderler ve PDF raporları düzenli şekilde hazırlanır.", FileText],
  ["Yönetici görünürlüğü", "Günlük operasyon, planlanan ve tamamlanan işler daha anlaşılır panellerde izlenir.", BarChart3],
  ["Kurumsal güvenlik", "Yönetici ve taşeron girişleri farklı rol ve yetkilerle ayrılır.", ShieldCheck],
  ["Şeflek Tur’a özel altyapı", "TransitOS, Şeflek Tur işleyişine göre tasarlanmış özel operasyon katmanıdır.", MonitorCog]
] as const;

export default async function TransitOSInfoPage() {
  const content = await readSiteContent();

  return (
    <main className="new-site-page paged-site">
      <SiteHeader />
      <PageHero
        eyebrow="Şeflek Tur operasyon altyapısı"
        title={content.transitosTitle}
        body={content.transitosBody}
        imageUrl={content.mobileAppImageUrl || content.fleet[0]?.imageUrl}
        imageAlt="TransitOS operasyon paneli tanıtımı"
      />

      <section className="detail-card-grid">
        {features.map(([title, body, Icon]) => (
          <article className="detail-card hover-card" key={title}>
            <Icon size={28} />
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>

      <section className="page-cta-band hover-card">
        <div>
          <MonitorCog size={26} />
          <h2>Operasyon paneline geçin</h2>
          <p>Yalnızca yetkili kullanıcılar TransitOS arayüzüne giriş yapabilir.</p>
        </div>
        <Link className="new-primary" href="/login?next=/transitos/dashboard">
          TransitOS’a giriş yap <ArrowRight size={18} />
        </Link>
      </section>

      <MobileAppPromo title={content.mobileAppTitle} body={content.mobileAppBody} imageUrl={content.mobileAppImageUrl} />

      <SiteFooter tickerItems={content.tickerItems} />
    </main>
  );
}
