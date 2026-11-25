import { type CorporateLocale, translate, corporateHref, localizeSiteContent, localizeCorporateJsonLd } from "@/lib/corporate-locale";
import Link from "next/link";
import { ArrowRight, Bus } from "lucide-react";
import { readSiteContent } from "@/lib/site-content";
import { FleetCard, PageHero, SiteFooter, SiteHeader } from "@/app/seflektur/SiteChrome";
import { createServiceJsonLd } from "@/app/seflektur/seo";



export default async function FleetView({ locale = "tr" }: { locale?: CorporateLocale } = {}) {
  const t = (value: string | undefined) => translate(locale, value);
  const content = localizeSiteContent(await readSiteContent(), locale);

  return (
    <main lang={locale === "eng" ? "en" : locale === "zh" ? "zh-Hans" : locale} className="new-site-page paged-site corp-v2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localizeCorporateJsonLd(createServiceJsonLd({ name: "Kurumsal Servis Filosu", description: "İstanbul personel, okul ve turizm taşımacılığı için farklı kapasitelere sahip kurumsal araç filosu.", path: "/seflektur/filo", image: "/site-media/hero-fleet.png", serviceTypes: ["Kurumsal filo planlama", "Personel servis aracı", "Turizm aracı"] }), locale)) }} />
      <SiteHeader locale={locale} />
      <PageHero locale={locale}
        eyebrow={t("Beyaz filo standardı")}
        title={t("Servis ve turizm araçlarında kurumsal filo görünümü.")}
        body={t("Mercedes-Benz Sprinter, Travego, Tourismo, Renault Master, Fiat Ducato, Volkswagen Crafter Volt ve Ford Transit gibi araç tipleriyle farklı kapasite ihtiyaçları karşılanır.")}
        imageUrl={content.fleetHeroImageUrl}
        imageAlt={t("Beyaz servis filosu")}
      />

      <section className="new-fleet-grid page-fleet-grid">
        {content.fleet.map((vehicle) => <FleetCard locale={locale} card={vehicle} key={t(vehicle.title)} />)}
      </section>

      <section className="page-cta-band hover-card">
        <div>
          <Bus size={26} />
          <h2>{t("Filo ihtiyacınızı birlikte planlayalım.")}</h2>
          <p>{t("Personel sayısı, servis saati ve güzergah yoğunluğuna göre araç tipi ve kapasite önerisi hazırlanabilir.")}</p>
        </div>
        <Link className="new-primary" href={corporateHref(locale, "/seflektur/teklif")}>{t("Filo talebi oluştur")}<ArrowRight size={18} />
        </Link>
      </section>

      <SiteFooter locale={locale} tickerItems={content.tickerItems} />
    </main>
  );
}

