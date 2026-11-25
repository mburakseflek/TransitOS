import { type CorporateLocale, translate, corporateHref, localizeSiteContent, localizeCorporateJsonLd } from "@/lib/corporate-locale";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { readSiteContent } from "@/lib/site-content";
import { FleetCard, PageHero, SiteFooter, SiteHeader } from "@/app/seflektur/SiteChrome";
import { createServiceJsonLd } from "@/app/seflektur/seo";



export default async function VipView({ locale = "tr" }: { locale?: CorporateLocale } = {}) {
  const t = (value: string | undefined) => translate(locale, value);
  const content = localizeSiteContent(await readSiteContent(), locale);
  const structuredData = createServiceJsonLd({
    name: "İstanbul VIP Transfer ve Özel Yolculuk",
    description: "İstanbul'da yönetici, misafir, havalimanı, otel ve organizasyonlar için VIP transfer hizmeti.",
    path: "/seflektur/vip",
    serviceTypes: ["VIP transfer", "Havalimanı transferi", "Özel yolculuk"]
  });

  return (
    <main lang={locale === "eng" ? "en" : locale === "zh" ? "zh-Hans" : locale} className="new-site-page paged-site corp-v2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localizeCorporateJsonLd(structuredData, locale)) }} />
      <SiteHeader locale={locale} />
      <PageHero locale={locale}
        eyebrow={t("VIP yolculuk")}
        title={t("Özel transferlerde konforlu ve prestijli ulaşım.")}
        body={t("Yönetici, misafir, otel, toplantı, havalimanı ve özel organizasyon transferleri için VIP araç seçenekleri.")}
        imageUrl={content.vipHeroImageUrl}
        imageAlt={t("VIP yolculuk aracı")}
      />

      <section className="new-vip-grid page-vip-grid">
        {content.vipFleet.map((vehicle) => <FleetCard locale={locale} card={vehicle} vip key={t(vehicle.title)} />)}
      </section>

      <section className="page-cta-band vip-cta hover-card">
        <div>
          <Sparkles size={26} />
          <h2>{t("VIP transfer talebinizi planlayalım.")}</h2>
          <p>{t("Araç tipi, karşılama noktası, saat ve yolcu bilgisiyle size özel transfer planı hazırlanabilir.")}</p>
        </div>
        <Link className="new-primary" href={corporateHref(locale, "/seflektur/teklif")}>{t("VIP hizmet talebi")}<ArrowRight size={18} />
        </Link>
      </section>

      <SiteFooter locale={locale} tickerItems={content.tickerItems} />
    </main>
  );
}

