import Link from "next/link";
import { ArrowRight, BadgeCheck, Bus, CheckCircle2, FileText, Handshake, Headphones, Mail, MapPinned, ShieldCheck, Route, Sparkles } from "lucide-react";
import { readSiteContent } from "@/lib/site-content";
import { CompanyInfoList } from "@/app/seflektur/CompanyInfoList";
import { MobileAppPromo, PageHero, SiteFooter, SiteHeader } from "@/app/seflektur/SiteChrome";
import { corporateFaqItems, createCorporateMetadata, createHomePageJsonLd } from "@/app/seflektur/seo";

const heroFleetImage =
  "/site-media/hero-home.png";

export const metadata = createCorporateMetadata({
  path: "/seflektur"
});

const pageCards = [
  {
    title: "Hizmetler",
    body: "Okul, personel, turizm, günlük yolculuk ve VIP taşımacılık hizmetlerini inceleyin.",
    href: "/seflektur/hizmetler",
    icon: Route
  },
  {
    title: "Filo",
    body: "Mercedes-Benz Sprinter, Travego, Tourismo, Renault Master, Fiat Ducato, Crafter ve Transit araç tipleri.",
    href: "/seflektur/filo",
    icon: Bus
  },
  {
    title: "VIP Araçlar",
    body: "Mercedes-Benz Vito, Volkswagen Transporter ve Mercedes-Benz E200 ile özel transfer hizmetleri.",
    href: "/seflektur/vip",
    icon: Sparkles
  },
  {
    title: "Ayrıcalıklar",
    body: "7/24 iletişim, operasyon takibi, evrak disiplini ve TransitOS destekli raporlama.",
    href: "/seflektur/ayricaliklar",
    icon: BadgeCheck
  },
  {
    title: "Belgeler ve Standartlar",
    body: "SRC, psikoteknik, D2, TÜRSAB, İBB güzergah, sigorta ve evrak takip süreçleri.",
    href: "/seflektur/standartlar",
    icon: ShieldCheck
  },
  {
    title: "Referanslar",
    body: "Kurumsal markalar, restoran zincirleri, ulaşım ve turizm iş ortaklarımızı inceleyin.",
    href: "/seflektur/referanslar",
    icon: Handshake
  },
  {
    title: "İletişim",
    body: "Telefon, e-posta, adres ve hizmet talep yönlendirmelerine ulaşın.",
    href: "/seflektur/iletisim",
    icon: Mail
  }
] as const;

export default async function SeflekTurPage() {
  const content = await readSiteContent();

  return (
    <main className="new-site-page paged-site home-site-page corp-v2">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(createHomePageJsonLd()) }}
      />
      <SiteHeader />

      <PageHero
        eyebrow="Şeflek Tur Turizm & Yolcu Taşımacılığı"
        title={content.heroTitle}
        body={content.heroSubtitle}
        imageUrl={content.homeHeroImageUrl || heroFleetImage}
        imageAlt="Şeflek Tur filo tanıtım görseli"
      >
        <div className="new-hero-actions">
          <Link className="new-primary" href="/seflektur/teklif">
            Hizmet talebi oluştur <ArrowRight size={18} />
          </Link>
          <Link className="new-secondary" href="/seflektur/tasimacilar">
            Taşımacı başvurusu
          </Link>
        </div>
      </PageHero>

      <section className="corp-v2-proof">
        <div><strong>7/24</strong><span>Ulaşılabilir operasyon</span></div>
        <div><strong>TransitOS</strong><span>Dijital takip ve raporlama</span></div>
        <div><strong>Beyaz Filo</strong><span>Kurumsal araç görünümü</span></div>
      </section>

      <section className="corp-v2-intro" aria-labelledby="istanbul-ulasim-cozumleri">
        <div className="corp-v2-intro-copy">
          <span className="corp-v2-section-label">İstanbul ulaşım çözümleri</span>
          <h2 id="istanbul-ulasim-cozumleri">Personel servisi, okul servisi ve VIP transfer tek operasyon disipliniyle.</h2>
          <p>
            Şeflek Tur; İstanbul genelindeki kurumlar, okullar, etkinlik ekipleri ve bireysel yolcular için
            ihtiyaca göre güzergah, araç ve zaman planlaması yapar. Süreç; teklif aşamasından servis takibi ve
            raporlamaya kadar ulaşılabilir bir operasyon ekibiyle yürütülür.
          </p>
          <Link className="text-action-link" href="/seflektur/hizmetler">
            Tüm taşımacılık hizmetlerini incele <ArrowRight size={17} />
          </Link>
        </div>
        <div className="corp-v2-service-list" aria-label="Şeflek Tur hizmet alanları">
          {["Kurumsal personel taşımacılığı", "Okul ve öğrenci servisi", "Havalimanı ve VIP transfer", "Turizm ve organizasyon ulaşımı"].map((service) => (
            <div key={service}><CheckCircle2 size={19} aria-hidden="true" /><span>{service}</span></div>
          ))}
          <div><MapPinned size={19} aria-hidden="true" /><span>İstanbul merkezli planlama ve destek</span></div>
        </div>
      </section>

      <section className="corp-v2-process">
        <header>
          <span className="corp-v2-section-label">Nasıl çalışıyoruz?</span>
          <h2>Talebinizden yolculuğun sonuna kadar tek ekip.</h2>
          <Link href="/seflektur/teklif">Planlama başlatın <ArrowRight size={17} /></Link>
        </header>
        <ol>
          <li><span>01</span><div><strong>İhtiyacı dinliyoruz</strong><p>Yolcu, güzergâh, saat ve hizmet beklentisini netleştiriyoruz.</p></div></li>
          <li><span>02</span><div><strong>Operasyonu kuruyoruz</strong><p>Uygun araç, sürücü ve çalışma planını tek merkezden oluşturuyoruz.</p></div></li>
          <li><span>03</span><div><strong>Takip ve raporlama</strong><p>Operasyon sürecini TransitOS ile izliyor, gerekli çıktıları sunuyoruz.</p></div></li>
        </ol>
      </section>

      <section className="corp-v2-services">
        <div className="corp-v2-section-head">
          <div><span className="corp-v2-section-label">Hizmet alanlarımız</span><h2>Her yolculuk için doğru çözüm.</h2></div>
          <p>Kurumsal servislerden özel transferlere kadar farklı ihtiyaçları aynı operasyon standardıyla yönetiyoruz.</p>
        </div>
        <div className="corp-v2-service-grid">
          {pageCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Link className="corp-v2-service-card" href={card.href} key={card.title}>
                <span className="corp-v2-card-number">0{index + 1}</span>
                <Icon size={25} aria-hidden="true" />
                <h3>{card.title}</h3>
                <p>{card.body}</p>
                <span className="corp-v2-card-link">İnceleyin <ArrowRight size={16} /></span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="company-preview-card hover-card">
        <div>
          <span className="new-eyebrow">Kurumsal yapı</span>
          <h2>Şirket künyesi ve çalışma yaklaşımı</h2>
          <p>{content.companySummary}</p>
        </div>
        <CompanyInfoList
          phone={content.contactPhone}
          email={content.contactEmail}
          address={content.address}
          taxOffice={content.taxOffice}
          taxNumber={content.taxNumber}
          details={content.companyDetails}
        />
      </section>

      <MobileAppPromo title={content.mobileAppTitle} body={content.mobileAppBody} imageUrl={content.mobileAppImageUrl} />

      <section className="references-preview-section">
        <div className="section-title-block">
          <span className="new-eyebrow">Referanslar ve iş ortakları</span>
          <h2>Şeflek Tur iş ortaklığı ağı büyümeye devam ediyor.</h2>
        </div>
        <div className="partner-strip">
          {content.references.slice(0, 8).map((partner) => (
            <span className="partner-strip-item" key={partner.title}>
              {partner.imageUrl ? <img src={partner.imageUrl} alt={partner.title} loading="lazy" decoding="async" /> : partner.title}
            </span>
          ))}
        </div>
        <Link className="new-secondary" href="/seflektur/referanslar">
          Tüm referansları incele <ArrowRight size={16} />
        </Link>
      </section>

      {content.customPages.length ? (
        <section className="page-menu-section">
          <div className="section-title-block">
            <span className="new-eyebrow">Özel sayfalar</span>
            <h2>Şeflek Tur içeriklerinden öne çıkanlar.</h2>
          </div>
          <div className="page-card-grid">
            {content.customPages.map((page) => (
              <Link className="page-card hover-card" href={`/seflektur/sayfa/${page.slug}`} key={page.id}>
                <FileText size={26} />
                <strong>{page.title}</strong>
                <p>{page.summary}</p>
                <span>Sayfayı aç <ArrowRight size={16} /></span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="new-form-links">
        <Link className="hover-card" href="/seflektur/tasimacilar">
          <Bus size={25} />
          <strong>Taşımacı olarak çalışmak istiyorum</strong>
          <span>Taşeron başvuru formunu doldurun <ArrowRight size={16} /></span>
        </Link>
        <Link className="hover-card" href="/seflektur/teklif">
          <FileText size={25} />
          <strong>Hizmet almak istiyorum</strong>
          <span>Servis, turizm veya VIP yolculuk talebi oluşturun <ArrowRight size={16} /></span>
        </Link>
        <Link className="hover-card" href="/seflektur/ayricaliklar">
          <Headphones size={25} />
          <strong>7/24 iletişim</strong>
          <span>Şeflek Tur ayrıcalıklarını inceleyin <ArrowRight size={16} /></span>
        </Link>
      </section>

      <section className="corporate-faq-section" aria-labelledby="sik-sorulan-sorular">
        <div className="section-title-block">
          <span className="new-eyebrow">Hızlı yanıtlar</span>
          <h2 id="sik-sorulan-sorular">Şeflek Tur hakkında sık sorulan sorular</h2>
          <p>Hizmet kapsamı, araç seçenekleri ve çalışma süreciyle ilgili temel bilgiler.</p>
        </div>
        <div className="corporate-faq-list">
          {corporateFaqItems.map((item, index) => (
            <details key={item.question} open={index === 0}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <SiteFooter tickerItems={content.tickerItems} />
    </main>
  );
}
