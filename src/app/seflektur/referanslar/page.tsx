import Link from "next/link";
import { ArrowRight, Building2, Handshake } from "lucide-react";
import { readSiteContent, type SiteCard } from "@/lib/site-content";
import { SiteFooter, SiteHeader } from "@/app/seflektur/SiteChrome";
import { SkiperLogoShowcase } from "@/app/components/RegistryInterfaceKit";

export default async function ReferencesPage() {
  const content = await readSiteContent();

  return (
    <main className="new-site-page paged-site">
      <SiteHeader />

      <section className="references-hero">
        <div className="references-hero-copy">
          <span className="new-eyebrow">Referanslar ve İş Ortakları</span>
          <h1>Güvenilir markalarla aynı operasyon disiplininde buluşuyoruz.</h1>
          <p>
            Şeflek Tur; personel taşımacılığı, kurumsal servis, turizm ve özel ulaşım ihtiyaçlarında referanslarını
            düzenli, izlenebilir ve geliştirilebilir bir iş ortaklığı yaklaşımıyla büyütür.
          </p>
        </div>
        <SkiperLogoShowcase items={content.references} />
      </section>

      <section className="references-intro hover-card">
        <div>
          <span className="new-eyebrow">İş ortaklığı ağı</span>
          <h2>Markalar, kurumlar ve taşımacılık iş ortakları tek bir referans çatısında.</h2>
          <p>
            Bu alan yönetici panelinden büyütülebilir. Yeni iş ortağı eklendiğinde logo, kategori ve açıklama
            doğrudan bu sayfada yayına alınır.
          </p>
        </div>
      </section>

      <section className="partner-logo-grid">
        {content.references.map((partner) => (
          <PartnerCard partner={partner} key={partner.title} />
        ))}
      </section>

      <section className="page-cta-band hover-card">
        <div>
          <Handshake size={26} />
          <h2>Şeflek Tur iş ortaklığı ağına katılın.</h2>
          <p>Kurumsal hizmet almak ya da taşımacı olarak çalışmak için ilgili form üzerinden başvuru bırakabilirsiniz.</p>
        </div>
        <div className="new-hero-actions">
          <Link className="new-primary" href="/seflektur/teklif">
            Hizmet talebi oluştur <ArrowRight size={18} />
          </Link>
          <Link className="new-secondary" href="/seflektur/tasimacilar">
            Taşımacı başvurusu
          </Link>
        </div>
      </section>

      <SiteFooter tickerItems={content.tickerItems} />
    </main>
  );
}

function PartnerCard({ partner }: { partner: SiteCard }) {
  return (
    <article className="partner-logo-card hover-card">
      <div className="partner-logo-mark">
        {partner.imageUrl ? (
          <img src={partner.imageUrl} alt={partner.title} />
        ) : (
          <span>{partner.title}</span>
        )}
      </div>
      <div>
        <small>{partner.meta || "Referans"}</small>
        <h2>{partner.title}</h2>
        <strong>{partner.subtitle}</strong>
        <p>{partner.body}</p>
      </div>
      <Building2 size={20} />
    </article>
  );
}
