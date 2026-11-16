import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { readSiteContent } from "@/lib/site-content";
import { FleetCard, PageHero, SiteFooter, SiteHeader } from "@/app/seflektur/SiteChrome";
import { createCorporateMetadata, createServiceJsonLd } from "@/app/seflektur/seo";

export const metadata = createCorporateMetadata({
  title: "VIP Transfer İstanbul | Şeflek Tur",
  description:
    "Şeflek Tur, İstanbul'da Mercedes-Benz Vito, Volkswagen Transporter, Mercedes-Benz Sprinter ve Mercedes-Benz E200 ile VIP transfer ve özel yolculuk hizmetleri sunar.",
  path: "/seflektur/vip"
});

export default async function VipPage() {
  const content = await readSiteContent();
  const structuredData = createServiceJsonLd({
    name: "İstanbul VIP Transfer ve Özel Yolculuk",
    description: "İstanbul'da yönetici, misafir, havalimanı, otel ve organizasyonlar için VIP transfer hizmeti.",
    path: "/seflektur/vip",
    serviceTypes: ["VIP transfer", "Havalimanı transferi", "Özel yolculuk"]
  });

  return (
    <main className="new-site-page paged-site corp-v2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <SiteHeader />
      <PageHero
        eyebrow="VIP yolculuk"
        title="Özel transferlerde konforlu ve prestijli ulaşım."
        body="Yönetici, misafir, otel, toplantı, havalimanı ve özel organizasyon transferleri için VIP araç seçenekleri."
        imageUrl={content.vipHeroImageUrl}
        imageAlt="VIP yolculuk aracı"
      />

      <section className="new-vip-grid page-vip-grid">
        {content.vipFleet.map((vehicle) => <FleetCard card={vehicle} vip key={vehicle.title} />)}
      </section>

      <section className="page-cta-band vip-cta hover-card">
        <div>
          <Sparkles size={26} />
          <h2>VIP transfer talebinizi planlayalım.</h2>
          <p>Araç tipi, karşılama noktası, saat ve yolcu bilgisiyle size özel transfer planı hazırlanabilir.</p>
        </div>
        <Link className="new-primary" href="/seflektur/teklif">
          VIP hizmet talebi <ArrowRight size={18} />
        </Link>
      </section>

      <SiteFooter tickerItems={content.tickerItems} />
    </main>
  );
}
