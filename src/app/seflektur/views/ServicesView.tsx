import { type CorporateLocale, translate, corporateHref, localizeSiteContent, localizeCorporateJsonLd } from "@/lib/corporate-locale";
import Link from "next/link";
import { ArrowRight, Bus, Clock3, MapPinned, Route, Sparkles, UsersRound } from "lucide-react";
import { readSiteContent } from "@/lib/site-content";
import { PageHero, SiteFooter, SiteHeader } from "@/app/seflektur/SiteChrome";
import { createServiceJsonLd } from "@/app/seflektur/seo";

const serviceIcons = [UsersRound, Route, MapPinned, Clock3, Sparkles];



export default async function ServicesView({ locale = "tr" }: { locale?: CorporateLocale } = {}) {
  const originalContent = await readSiteContent();
  const t = (value: string | undefined) => translate(locale, value, locale === "tr" ? undefined : originalContent.translations?.[locale]);
  const content = localizeSiteContent(originalContent, locale);

  return (
    <main lang={locale === "eng" ? "en" : locale === "zh" ? "zh-Hans" : locale} className="new-site-page paged-site corp-v2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localizeCorporateJsonLd(createServiceJsonLd({ name: "İstanbul Personel Servisi ve Yolcu Taşımacılığı", description: "İstanbul'da personel servisi, okul servisi, turizm, organizasyon ve VIP transfer planlama hizmetleri.", path: "/seflektur/hizmetler", image: "/site-media/service-personnel.png", serviceTypes: ["Personel servisi", "Okul servisi", "VIP transfer", "Turizm taşımacılığı"] }), locale)) }} />
      <SiteHeader locale={locale} />
      <PageHero locale={locale}
        eyebrow={t("Hizmetler")}
        title={t("Her yolculuk tipi için ayrı planlama disiplini.")}
        body={t("Şeflek Tur; okul, personel, turizm, günlük yolculuk ve VIP ulaşım taleplerini farklı operasyon ihtiyaçlarına göre planlar.")}
        imageUrl={content.services[0]?.imageUrl || content.fleet[0]?.imageUrl}
        imageAlt={t("Servis ve turizm taşımacılığı")}
      />

      <section className="detail-card-grid">
        <nav className="service-intent-links" aria-label={t("Hizmet rehberleri")}>
          <Link href={{ pathname: "/seflektur/hizmetler/personel-servisi" }}>{t("Personel servisi")}</Link>
          <Link href={{ pathname: "/seflektur/hizmetler/okul-servisi" }}>{t("Okul servisi")}</Link>
          <Link href={{ pathname: "/seflektur/hizmetler/vip-transfer" }}>{t("VIP transfer")}</Link>
        </nav>
        {content.services.map((service, index) => {
          const Icon = serviceIcons[index % serviceIcons.length];
            return (
              <article className="detail-card hover-card" key={t(service.title)}>
                {service.imageUrl ? (
                  <div className="service-image">
                    <img src={service.imageUrl} alt={t(service.title)} loading="lazy" decoding="async" />
                    <Icon size={28} />
                  </div>
                ) : <Icon size={28} />}
                <div className="detail-card-body">
                  <small>{t(service.meta)}</small>
                  <h2>{t(service.title)}</h2>
                  <strong>{t(service.subtitle)}</strong>
                  <p>{t(service.body)}</p>
                </div>
              </article>
            );
        })}
      </section>

      <section className="page-cta-band hover-card">
        <div>
          <Bus size={26} />
          <h2>{t("İhtiyacınıza göre servis veya VIP yolculuk planlayalım.")}</h2>
          <p>{t("Yolcu sayısı, güzergah, çalışma saati ve hizmet tipini iletin; size uygun planlama hazırlansın.")}</p>
        </div>
        <Link className="new-primary" href={corporateHref(locale, "/seflektur/teklif")}>{t("Hizmet talebi oluştur")}<ArrowRight size={18} />
        </Link>
      </section>

      <DesignBlocks page="services" locale={locale} />
      <SiteFooter locale={locale} tickerItems={content.tickerItems} />
    </main>
  );
}

import { DesignBlocks } from "../DesignBlocks";
