import Link from "next/link";
import { ArrowRight, BadgeCheck, FileCheck2, Headphones, ShieldCheck } from "lucide-react";
import { readSiteContent } from "@/lib/site-content";
import { PageHero, SiteFooter, SiteHeader } from "@/app/seflektur/SiteChrome";
import { createCorporateMetadata } from "@/app/seflektur/seo";

const privileges = [
  ["7/24 Ulaşılabilirlik", "Operasyon sırasında hızlı iletişim, yönlendirme ve çözüm odaklı takip.", Headphones],
  ["Evrak ve filo disiplini", "Araç, sürücü ve belge süreçlerinde düzenli kontrol yaklaşımı.", FileCheck2],
  ["TransitOS destekli raporlama", "Planlanan ve tamamlanan servislerin dijital olarak takip edilebilirliği.", BadgeCheck],
  ["Güvenli hizmet standardı", "Okul, personel, turizm ve VIP taşımada kontrollü operasyon süreci.", ShieldCheck]
] as const;

export const metadata = createCorporateMetadata({
  title: "Şeflek Tur Ayrıcalıkları | 7/24 Kurumsal Taşımacılık",
  description:
    "Şeflek Tur; 7/24 ulaşılabilirlik, evrak takibi, filo disiplini, güvenli hizmet standardı ve TransitOS destekli raporlama ile kurumsal taşımacılık hizmeti sunar.",
  path: "/seflektur/ayricaliklar"
});

export default async function PrivilegesPage() {
  const content = await readSiteContent();

  return (
    <main className="new-site-page paged-site">
      <SiteHeader />
      <PageHero
        eyebrow="Şeflek Tur ayrıcalıkları"
        title="Operasyon süreci görünür, ulaşılabilir ve raporlanabilir kalır."
        body="Kurumsal taşımacılıkta yalnızca araç değil; iletişim, evrak, planlama, takip ve raporlama disiplini de hizmetin parçasıdır."
        imageUrl={content.privileges.find((item) => item.imageUrl)?.imageUrl || content.fleet[0]?.imageUrl}
        imageAlt="Kurumsal taşımacılık operasyonu"
      />

      <section className="new-privilege-grid page-privilege-grid">
        {privileges.map(([title, body, Icon]) => (
          <article className="new-privilege-card hover-card" key={title}>
            <Icon size={26} />
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>

      <section className="page-cta-band hover-card">
        <div>
          <BadgeCheck size={26} />
          <h2>TransitOS ile operasyon takibi</h2>
          <p>{content.transitosBody}</p>
        </div>
        <Link className="new-primary" href="/seflektur/transitos">
          TransitOS’u incele <ArrowRight size={18} />
        </Link>
      </section>

      <SiteFooter tickerItems={content.tickerItems} />
    </main>
  );
}
