import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/app/components/WhatsAppIcon";
import { CorporateMobileNav } from "@/app/seflektur/CorporateMobileNav";
import { readSiteContent, SiteCard } from "@/lib/site-content";
import { MarketTicker } from "@/app/components/MarketTicker";

const siteNavLinks = [
  { href: "/seflektur", label: "Ana Sayfa" },
  { href: "/seflektur/hizmetler", label: "Hizmetler" },
  { href: "/seflektur/filo", label: "Filo" },
  { href: "/seflektur/vip", label: "VIP" },
  { href: "/seflektur/ayricaliklar", label: "Ayrıcalıklar" },
  { href: "/seflektur/standartlar", label: "Belgeler" },
  { href: "/seflektur/referanslar", label: "Referanslar" },
  { href: "/seflektur/transitos", label: "TransitOS" },
  { href: "/seflektur/iletisim", label: "İletişim" },
  { href: "/seflektur/teklif", label: "Hizmet Talebi", className: "new-nav-cta" }
] as const;

export function SiteHeader() {
  return (
    <>
      <a className="site-skip-link" href="#main-content">Ana içeriğe geç</a>
      <CorporateMobileNav links={siteNavLinks} />
      <header className="corp-v2-header">
        <div className="corp-v2-header-inner">
          <Link className="corp-v2-brand" href="/seflektur" aria-label="Şeflek Tur ana sayfa">
            <img src="/brand/seflek-logo-navy.png" alt="Şeflek Tur" width="236" height="92" decoding="async" />
          </Link>
          <nav className="corp-v2-nav" aria-label="Kurumsal site menüsü">
            <Link href="/seflektur/hizmetler">Hizmetler</Link>
            <Link href="/seflektur/filo">Filo</Link>
            <Link href="/seflektur/vip">VIP Transfer</Link>
            <Link href="/seflektur/standartlar">Standartlarımız</Link>
            <Link href="/seflektur/referanslar">Referanslar</Link>
            <Link href="/seflektur/iletisim">İletişim</Link>
          </nav>
          <div className="corp-v2-header-actions">
            <Link className="corp-v2-portal-link" href="/seflektur/transitos">TransitOS</Link>
            <Link className="corp-v2-header-cta" href="/seflektur/teklif">Teklif alın <ArrowRight size={16} /></Link>
          </div>
        </div>
      </header>
    </>
  );
}

export function PageHero({
  eyebrow,
  title,
  body,
  imageUrl,
  imageAlt,
  children
}: {
  eyebrow: string;
  title: string;
  body: string;
  imageUrl?: string;
  imageAlt?: string;
  children?: ReactNode;
}) {
  return (
    <section className="corp-v2-hero" id="main-content">
      <div className="corp-v2-hero-copy">
        <span className="corp-v2-kicker">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{body}</p>
        {children}
        <div className="corp-v2-hero-meta" aria-label="Şeflek Tur hizmet özellikleri">
          <span><b>7/24</b> operasyon desteği</span>
          <span><b>İstanbul</b> merkezli planlama</span>
          <span><b>TransitOS</b> ile takip</span>
        </div>
      </div>
      {imageUrl ? (
        <div className="corp-v2-hero-visual">
          <img src={imageUrl} alt={imageAlt ?? title} width="1280" height="960" decoding="async" fetchPriority="high" />
          <div className="corp-v2-image-note"><span>Şeflek Tur</span><strong>Güvenli ulaşım, kontrollü operasyon.</strong></div>
        </div>
      ) : null}
    </section>
  );
}

export function FleetCard({ card, vip = false }: { card: SiteCard; vip?: boolean }) {
  return (
    <article className={vip ? "new-fleet-card vip-fleet-card hover-card" : "new-fleet-card branded-fleet-card hover-card"}>
      <div className="new-fleet-photo">
        {card.imageUrl ? <img src={card.imageUrl} alt={card.title} width="720" height="520" loading="lazy" decoding="async" /> : null}
        {!vip ? (
          <span className="fleet-logo-decal">
            <img src="/brand/seflek-logo-navy.png" alt="" width="236" height="92" loading="lazy" decoding="async" />
          </span>
        ) : null}
        <small>{card.meta}</small>
      </div>
      <div className="new-fleet-body">
        <h3>{card.title}</h3>
        <strong>{card.subtitle}</strong>
        <p>{card.body}</p>
        <span className="card-more">Detayları incele <ArrowRight size={15} /></span>
      </div>
    </article>
  );
}

export function MobileAppPromo({
  title,
  body,
  imageUrl
}: {
  title: string;
  body: string;
  imageUrl: string;
}) {
  return (
    <section className="mobile-app-promo hover-card">
      <div>
        <span className="new-eyebrow">TransitOS Mobile</span>
        <h2>{title}</h2>
        <p>{body}</p>
        <div className="store-badges">
          <span>App Store</span>
          <span>Google Play</span>
        </div>
      </div>
      <div className="mobile-app-visual">
        {imageUrl ? <img src={imageUrl} alt={title} width="720" height="720" loading="lazy" decoding="async" /> : null}
        <img className="mobile-app-logo" src="/brand/seflek-logo-navy.png" alt="Şeflek Tur" width="236" height="92" loading="lazy" decoding="async" />
      </div>
    </section>
  );
}

export async function SiteFooter({ tickerItems }: { tickerItems: string[] }) {
  const content = await readSiteContent();
  const whatsappNumber = whatsappLinkNumber(content.whatsappNumber || content.contactPhone);

  return (
    <>
      <footer className="corp-v2-footer">
        <div className="corp-v2-footer-brand">
          <img src="/seflek-logo-white.png" alt="Şeflek Tur" width="236" height="92" loading="lazy" decoding="async" />
          <p>İstanbul merkezli kurumsal personel, okul, turizm ve VIP taşımacılık çözümleri.</p>
        </div>
        <div className="corp-v2-footer-links">
          <strong>Şeflek Tur</strong>
          <Link href="/seflektur/hizmetler">Hizmetler</Link>
          <Link href="/seflektur/filo">Filo</Link>
          <Link href="/seflektur/referanslar">Referanslar</Link>
        </div>
        <div className="corp-v2-footer-links">
          <strong>İletişim</strong>
          <a href={`tel:${content.contactPhone.replace(/\s/g, "")}`}><Phone size={15} /> {content.contactPhone}</a>
          <a href={`mailto:${content.contactEmail}`}>{content.contactEmail}</a>
          <Link href="/seflektur/teklif">Hizmet talebi</Link>
        </div>
        <small className="corp-v2-footer-rights">© {new Date().getFullYear()} Şeflek Tur. Tüm hakları saklıdır.</small>
      </footer>

      {whatsappNumber ? (
        <a
          className="whatsapp-float"
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp sohbeti başlat"
        >
          <WhatsAppIcon />
          <span>WhatsApp</span>
        </a>
      ) : null}

      <MarketTicker fallbackItems={tickerItems} placement="site" />
    </>
  );
}

function whatsappLinkNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("90")) return digits;
  if (digits.startsWith("0")) return `9${digits}`;
  if (digits.length === 10) return `90${digits}`;
  return digits;
}
