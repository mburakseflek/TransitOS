import Link from "next/link";
import { ArrowRight, Bus } from "lucide-react";
import { readSiteContent } from "@/lib/site-content";
import { FleetCard, PageHero, SiteFooter, SiteHeader } from "@/app/seflektur/SiteChrome";
import { createCorporateMetadata } from "@/app/seflektur/seo";

export const metadata = createCorporateMetadata({
  title: "Şeflek Tur Filo | İstanbul Servis ve Turizm Araçları",
  description:
    "Şeflek Tur filosunda Mercedes-Benz Sprinter, Travego, Tourismo, Renault Master, Fiat Ducato, Volkswagen Crafter Volt ve Ford Transit araç tipleriyle servis ve turizm taşımacılığı planlanır.",
  path: "/seflektur/filo"
});

export default async function FleetPage() {
  const content = await readSiteContent();

  return (
    <main className="new-site-page paged-site">
      <SiteHeader />
      <PageHero
        eyebrow="Beyaz filo standardı"
        title="Servis ve turizm araçlarında kurumsal filo görünümü."
        body="Mercedes-Benz Sprinter, Travego, Tourismo, Renault Master, Fiat Ducato, Volkswagen Crafter Volt ve Ford Transit gibi araç tipleriyle farklı kapasite ihtiyaçları karşılanır."
        imageUrl={content.fleetHeroImageUrl}
        imageAlt="Beyaz servis filosu"
      />

      <section className="new-fleet-grid page-fleet-grid">
        {content.fleet.map((vehicle) => <FleetCard card={vehicle} key={vehicle.title} />)}
      </section>

      <section className="page-cta-band hover-card">
        <div>
          <Bus size={26} />
          <h2>Filo ihtiyacınızı birlikte planlayalım.</h2>
          <p>Personel sayısı, servis saati ve güzergah yoğunluğuna göre araç tipi ve kapasite önerisi hazırlanabilir.</p>
        </div>
        <Link className="new-primary" href="/seflektur/teklif">
          Filo talebi oluştur <ArrowRight size={18} />
        </Link>
      </section>

      <SiteFooter tickerItems={content.tickerItems} />
    </main>
  );
}
