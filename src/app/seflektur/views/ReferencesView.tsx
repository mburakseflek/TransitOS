import { type CorporateLocale, translate, corporateHref, localizeSiteContent } from "@/lib/corporate-locale";
import Link from "next/link";
import { ArrowRight, Building2, Handshake } from "lucide-react";
import { readSiteContent, type SiteCard } from "@/lib/site-content";
import { SiteFooter, SiteHeader } from "@/app/seflektur/SiteChrome";
import { SkiperLogoShowcase } from "@/app/components/RegistryInterfaceKit";



export default async function ReferencesView({ locale = "tr" }: { locale?: CorporateLocale } = {}) {
  const t = (value: string | undefined) => translate(locale, value);
  const content = localizeSiteContent(await readSiteContent(), locale);

  return (
    <main lang={locale === "eng" ? "en" : locale === "zh" ? "zh-Hans" : locale} className="new-site-page paged-site corp-v2">
      <SiteHeader locale={locale} />

      <section className="references-hero">
        <div className="references-hero-copy">
          <span className="new-eyebrow">{t("Referanslar ve İş Ortakları")}</span>
          <h1>{t("Güvenilir markalarla aynı operasyon disiplininde buluşuyoruz.")}</h1>
          <p>{t("Şeflek Tur; personel taşımacılığı, kurumsal servis, turizm ve özel ulaşım ihtiyaçlarında referanslarını düzenli, izlenebilir ve geliştirilebilir bir iş ortaklığı yaklaşımıyla büyütür.")}</p>
        </div>
        <SkiperLogoShowcase items={content.references} />
      </section>

      <section className="references-intro hover-card">
        <div>
          <span className="new-eyebrow">{t("İş ortaklığı ağı")}</span>
          <h2>{t("Markalar, kurumlar ve taşımacılık iş ortakları tek bir referans çatısında.")}</h2>
          <p>{t("Bu alan yönetici panelinden büyütülebilir. Yeni iş ortağı eklendiğinde logo, kategori ve açıklama doğrudan bu sayfada yayına alınır.")}</p>
        </div>
      </section>

      <section className="partner-logo-grid">
        {content.references.map((partner) => (
          <PartnerCard partner={partner} locale={locale} key={partner.title} />
        ))}
      </section>

      <section className="page-cta-band hover-card">
        <div>
          <Handshake size={26} />
          <h2>{t("Şeflek Tur iş ortaklığı ağına katılın.")}</h2>
          <p>{t("Kurumsal hizmet almak ya da taşımacı olarak çalışmak için ilgili form üzerinden başvuru bırakabilirsiniz.")}</p>
        </div>
        <div className="new-hero-actions">
          <Link className="new-primary" href={corporateHref(locale, "/seflektur/teklif")}>{t("Hizmet talebi oluştur")}<ArrowRight size={18} />
          </Link>
          <Link className="new-secondary" href={corporateHref(locale, "/seflektur/tasimacilar")}>{t("Taşımacı başvurusu")}</Link>
        </div>
      </section>

      <SiteFooter locale={locale} tickerItems={content.tickerItems} />
    </main>
  );
}

function PartnerCard({ partner, locale }: { partner: SiteCard; locale: CorporateLocale }) {
  const t = (value: string) => translate(locale,value);
  return (
    <article className="partner-logo-card hover-card">
      <div className="partner-logo-mark">
        {partner.imageUrl ? (
          <img src={partner.imageUrl} alt={t(partner.title)} loading="lazy" decoding="async" />
        ) : (
          <span>{t(partner.title)}</span>
        )}
      </div>
      <div>
        <small>{partner.meta || "Referans"}</small>
        <h2>{t(partner.title)}</h2>
        <strong>{partner.subtitle}</strong>
        <p>{partner.body}</p>
      </div>
      <Building2 size={20} />
    </article>
  );
}

