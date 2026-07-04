import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bus,
  ClipboardCheck,
  FileCheck2,
  Leaf,
  ShieldCheck,
  Sparkles,
  UserCheck
} from "lucide-react";
import { readSiteContent } from "@/lib/site-content";
import { PageHero, SiteFooter, SiteHeader } from "@/app/seflektur/SiteChrome";

const standards = [
  {
    title: "SRC belgeli sürücüler",
    body: "Yolcu taşımacılığı operasyonlarında görev alan sürücüler için mesleki yeterlilik ve yetki belgesi takibi yapılır.",
    icon: BadgeCheck
  },
  {
    title: "Psikoteknik kontroller",
    body: "Sürücü uygunluk süreçlerinde psikoteknik belge periyotları takip edilir ve operasyon disiplini korunur.",
    icon: UserCheck
  },
  {
    title: "D2 belgeli araçlar",
    body: "Turizm ve yolcu taşımacılığı kapsamındaki araçların yetki ve kullanım belgeleri düzenli olarak kontrol edilir.",
    icon: FileCheck2
  },
  {
    title: "TÜRSAB belgeli araçlar",
    body: "Turizm operasyonlarında gerekli belge ve yetkilendirme süreçleri kurumsal kayıt altında tutulur.",
    icon: ClipboardCheck
  },
  {
    title: "İBB güzergah belgeleri",
    body: "İstanbul içi güzergah ve servis operasyonlarında ilgili izin ve güzergah belge kontrolleri takip edilir.",
    icon: ShieldCheck
  },
  {
    title: "Temiz ve hijyenik filo",
    body: "Araç içi temizlik, hijyen ve düzenli kullanım standartları servis kalitesinin parçası olarak ele alınır.",
    icon: Sparkles
  },
  {
    title: "Sürücü ve araç evrak takibi",
    body: "Ruhsat, sigorta, belge, sürücü evrakı ve periyodik kontrol süreçleri operasyon öncesinde izlenir.",
    icon: ClipboardCheck
  },
  {
    title: "Trafik ve koltuk sigortası",
    body: "Zorunlu trafik sigortası ve yolcu güvenliğini ilgilendiren sigorta süreçleri kurumsal takip altında tutulur.",
    icon: ShieldCheck
  },
  {
    title: "Çevre dostu beyaz filo",
    body: "Kurumsal beyaz filo görünümüyle temiz, sade, tanınabilir ve çevre duyarlılığı yüksek bir hizmet dili hedeflenir.",
    icon: Leaf
  }
] as const;

export default async function StandardsPage() {
  const content = await readSiteContent();

  return (
    <main className="new-site-page paged-site">
      <SiteHeader />
      <PageHero
        eyebrow="Belgeler ve standartlar"
        title="Profesyonel taşımacılık yalnızca araçla değil, belge ve kontrol disipliniyle başlar."
        body="Şeflek Tur; sürücü evrakları, araç belgeleri, güzergah izinleri, sigorta süreçleri ve filo hijyeni gibi operasyonel standartları kurumsal hizmet kalitesinin temel parçası olarak görür."
        imageUrl={content.fleetHeroImageUrl || content.homeHeroImageUrl}
        imageAlt="Şeflek Tur belge ve filo standartları"
      />

      <section className="standards-grid">
        {standards.map((item) => {
          const Icon = item.icon;
          return (
            <article className="standard-card hover-card" key={item.title}>
              <Icon size={28} />
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </article>
          );
        })}
      </section>

      <section className="license-note-band hover-card">
        <div>
          <Bus size={28} />
          <span className="new-eyebrow">Kurumsal güvence</span>
          <h2>Belge, sigorta ve evrak kontrolleri hizmet sürekliliği için düzenli takip edilir.</h2>
          <p>
            Belgeler, lisanslar ve operasyon kayıtları ilgili mevzuat ve kurum süreçlerine bağlı olarak güncellenir.
            Şeflek Tur, hizmet verdiği kurumlara karşı şeffaf, izlenebilir ve düzenli bir taşımacılık yaklaşımı sunar.
          </p>
        </div>
        <Link className="new-primary" href="/seflektur/teklif">
          Kurumsal hizmet talebi <ArrowRight size={18} />
        </Link>
      </section>

      <section className="corporate-rights-strip">
        <span>SRC, Psikoteknik, D2, TÜRSAB, İBB güzergah ve sigorta süreçleri ilgili yasal mevzuatlara bağlı olarak takip edilir.</span>
        <span>Şeflek Tur Turizm & Yolcu Taşımacılığı, marka ve operasyon standartlarını saklı tutar.</span>
      </section>

      <SiteFooter tickerItems={content.tickerItems} />
    </main>
  );
}
