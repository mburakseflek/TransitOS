import Link from "next/link";
import { ArrowRight, Bus, Clock3, MapPinned, Route, Sparkles, UsersRound } from "lucide-react";
import { readSiteContent } from "@/lib/site-content";
import { PageHero, SiteFooter, SiteHeader } from "@/app/seflektur/SiteChrome";
import { createCorporateMetadata } from "@/app/seflektur/seo";

const serviceIcons = [UsersRound, Route, MapPinned, Clock3, Sparkles];

export const metadata = createCorporateMetadata({
  title: "İstanbul Personel Servisi ve Okul Servisi | Şeflek Tur",
  description:
    "Şeflek Tur; İstanbul'da personel taşımacılığı, okul servisi, turizm, günlük yolculuk ve VIP transfer hizmetleri için güvenli ve planlı ulaşım çözümleri sunar.",
  path: "/seflektur/hizmetler"
});

export default async function ServicesPage() {
  const content = await readSiteContent();

  return (
    <main className="new-site-page paged-site">
      <SiteHeader />
      <PageHero
        eyebrow="Hizmetler"
        title="Her yolculuk tipi için ayrı planlama disiplini."
        body="Şeflek Tur; okul, personel, turizm, günlük yolculuk ve VIP ulaşım taleplerini farklı operasyon ihtiyaçlarına göre planlar."
        imageUrl={content.services[0]?.imageUrl || content.fleet[0]?.imageUrl}
        imageAlt="Servis ve turizm taşımacılığı"
      />

      <section className="detail-card-grid">
        {content.services.map((service, index) => {
          const Icon = serviceIcons[index % serviceIcons.length];
            return (
              <article className="detail-card hover-card" key={service.title}>
                {service.imageUrl ? (
                  <div className="service-image">
                    <img src={service.imageUrl} alt={service.title} />
                    <Icon size={28} />
                  </div>
                ) : <Icon size={28} />}
                <div className="detail-card-body">
                  <small>{service.meta}</small>
                  <h2>{service.title}</h2>
                  <strong>{service.subtitle}</strong>
                  <p>{service.body}</p>
                </div>
              </article>
            );
        })}
      </section>

      <section className="page-cta-band hover-card">
        <div>
          <Bus size={26} />
          <h2>İhtiyacınıza göre servis veya VIP yolculuk planlayalım.</h2>
          <p>Yolcu sayısı, güzergah, çalışma saati ve hizmet tipini iletin; size uygun planlama hazırlansın.</p>
        </div>
        <Link className="new-primary" href="/seflektur/teklif">
          Hizmet talebi oluştur <ArrowRight size={18} />
        </Link>
      </section>

      <SiteFooter tickerItems={content.tickerItems} />
    </main>
  );
}
