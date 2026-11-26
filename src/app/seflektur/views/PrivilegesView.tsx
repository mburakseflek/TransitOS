import { type CorporateLocale, translate, corporateHref, localizeSiteContent } from "@/lib/corporate-locale";
import Link from "next/link";
import { ArrowRight, BadgeCheck, FileCheck2, Headphones, ShieldCheck } from "lucide-react";
import { readSiteContent } from "@/lib/site-content";
import { PageHero, SiteFooter, SiteHeader } from "@/app/seflektur/SiteChrome";

const privileges = [
  ["7/24 Ulaşılabilirlik", "Operasyon sırasında hızlı iletişim, yönlendirme ve çözüm odaklı takip.", Headphones],
  ["Evrak ve filo disiplini", "Araç, sürücü ve belge süreçlerinde düzenli kontrol yaklaşımı.", FileCheck2],
  ["TransitOS destekli raporlama", "Planlanan ve tamamlanan servislerin dijital olarak takip edilebilirliği.", BadgeCheck],
  ["Güvenli hizmet standardı", "Okul, personel, turizm ve VIP taşımada kontrollü operasyon süreci.", ShieldCheck]
] as const;



export default async function PrivilegesView({ locale = "tr" }: { locale?: CorporateLocale } = {}) {
  const originalContent = await readSiteContent();
  const t = (value: string | undefined) => translate(locale, value, locale === "tr" ? undefined : originalContent.translations?.[locale]);
  const content = localizeSiteContent(originalContent, locale);

  return (
    <main lang={locale === "eng" ? "en" : locale === "zh" ? "zh-Hans" : locale} className="new-site-page paged-site corp-v2">
      <SiteHeader locale={locale} />
      <PageHero locale={locale}
        eyebrow={t("Şeflek Tur ayrıcalıkları")}
        title={t("Operasyon süreci görünür, ulaşılabilir ve raporlanabilir kalır.")}
        body={t("Kurumsal taşımacılıkta yalnızca araç değil; iletişim, evrak, planlama, takip ve raporlama disiplini de hizmetin parçasıdır.")}
        imageUrl={content.privileges.find((item) => item.imageUrl)?.imageUrl || content.fleet[0]?.imageUrl}
        imageAlt={t("Kurumsal taşımacılık operasyonu")}
      />

      <section className="new-privilege-grid page-privilege-grid">
        {privileges.map(([title, body, Icon]) => (
          <article className="new-privilege-card hover-card" key={t(title)}>
            <Icon size={26} />
            <h2>{t(title)}</h2>
            <p>{t(body)}</p>
          </article>
        ))}
      </section>

      <section className="page-cta-band hover-card">
        <div>
          <BadgeCheck size={26} />
          <h2>{t("TransitOS ile operasyon takibi")}</h2>
          <p>{content.transitosBody}</p>
        </div>
        <Link className="new-primary" href={corporateHref(locale, "/seflektur/transitos")}>{t("TransitOS’u incele")}<ArrowRight size={18} />
        </Link>
      </section>

      <DesignBlocks page="privileges" locale={locale} />
      <SiteFooter locale={locale} tickerItems={content.tickerItems} />
    </main>
  );
}

import { DesignBlocks } from "../DesignBlocks";
