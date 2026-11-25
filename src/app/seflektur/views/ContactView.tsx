import { type CorporateLocale, translate, corporateHref, localizeSiteContent, controlCopy } from "@/lib/corporate-locale";
import Link from "next/link";
import { ArrowRight, Send } from "lucide-react";
import { readSiteContent } from "@/lib/site-content";
import { PageHero, SiteFooter, SiteHeader } from "@/app/seflektur/SiteChrome";
import { ContactActions } from "@/app/seflektur/iletisim/ContactActions";



export default async function ContactView({ locale = "tr" }: { locale?: CorporateLocale } = {}) {
  const t = (value: string | undefined) => translate(locale, value);
  const content = localizeSiteContent(await readSiteContent(), locale);

  return (
    <main lang={locale === "eng" ? "en" : locale === "zh" ? "zh-Hans" : locale} className="new-site-page paged-site corp-v2">
      <SiteHeader locale={locale} />
      <PageHero locale={locale}
        eyebrow={t("İletişim")}
        title={t("Şeflek Tur ekibine ulaşın.")}
        body={t("Servis, turizm, VIP transfer, taşımacı başvurusu veya operasyon talepleriniz için bizimle iletişime geçebilirsiniz.")}
        imageUrl={content.fleet[0]?.imageUrl}
        imageAlt={t("Şeflek Tur iletişim")}
      />

      <ContactActions locale={locale} copy={controlCopy(locale)} phone={content.contactPhone} email={content.contactEmail} address={content.address} />

      <section className="page-cta-band hover-card">
        <div>
          <Send size={26} />
          <h2>{t("Talebinizi form üzerinden iletin.")}</h2>
          <p>{t("Servis, gezi, VIP yolculuk veya düzenli kurumsal taşımacılık ihtiyacınızı paylaşın.")}</p>
        </div>
        <Link className="new-primary" href={corporateHref(locale, "/seflektur/teklif")}>{t("Hizmet talebi oluştur")}<ArrowRight size={18} />
        </Link>
      </section>

      <SiteFooter locale={locale} tickerItems={content.tickerItems} />
    </main>
  );
}

