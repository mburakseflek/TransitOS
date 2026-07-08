import Link from "next/link";
import { ArrowRight, Send } from "lucide-react";
import { readSiteContent } from "@/lib/site-content";
import { PageHero, SiteFooter, SiteHeader } from "@/app/seflektur/SiteChrome";
import { ContactActions } from "@/app/seflektur/iletisim/ContactActions";
import { createCorporateMetadata } from "@/app/seflektur/seo";

export const metadata = createCorporateMetadata({
  title: "Şeflek Tur İletişim | İstanbul Servis ve VIP Transfer",
  description:
    "İstanbul personel servisi, okul servisi, VIP transfer ve kurumsal taşımacılık talepleriniz için Şeflek Tur iletişim bilgilerine ulaşın.",
  path: "/seflektur/iletisim"
});

export default async function ContactPage() {
  const content = await readSiteContent();

  return (
    <main className="new-site-page paged-site">
      <SiteHeader />
      <PageHero
        eyebrow="İletişim"
        title="Şeflek Tur ekibine ulaşın."
        body="Servis, turizm, VIP transfer, taşımacı başvurusu veya operasyon talepleriniz için bizimle iletişime geçebilirsiniz."
        imageUrl={content.fleet[0]?.imageUrl}
        imageAlt="Şeflek Tur iletişim"
      />

      <ContactActions phone={content.contactPhone} email={content.contactEmail} address={content.address} />

      <section className="page-cta-band hover-card">
        <div>
          <Send size={26} />
          <h2>Talebinizi form üzerinden iletin.</h2>
          <p>Servis, gezi, VIP yolculuk veya düzenli kurumsal taşımacılık ihtiyacınızı paylaşın.</p>
        </div>
        <Link className="new-primary" href="/seflektur/teklif">
          Hizmet talebi oluştur <ArrowRight size={18} />
        </Link>
      </section>

      <SiteFooter tickerItems={content.tickerItems} />
    </main>
  );
}
