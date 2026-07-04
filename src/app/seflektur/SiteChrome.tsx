import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { WhatsAppIcon } from "@/app/components/WhatsAppIcon";
import { SkiperMotionFrame, SkiperTickerRail } from "@/app/components/RegistryInterfaceKit";
import { readSiteContent, SiteCard } from "@/lib/site-content";
import { getMarketTickerItems } from "@/lib/market-data";

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
    <header className="new-site-nav">
      <Link className="navy-brand" href="/">
        <img src="/brand/seflek-logo-navy.png" alt="Şeflek Tur" />
      </Link>
      <nav className="site-desktop-nav" aria-label="Kurumsal site menüsü">
        {siteNavLinks.map((item) => (
          <Link key={item.href} className={"className" in item ? item.className : undefined} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
      <input className="site-mobile-nav-check" id="site-mobile-navigation" type="checkbox" aria-hidden="true" />
      <label className="site-mobile-menu-button" htmlFor="site-mobile-navigation" aria-label="Menüyü aç">
        <Menu size={19} />
        <span>Menü</span>
      </label>
      <label className="site-mobile-nav-backdrop" htmlFor="site-mobile-navigation" aria-label="Menüyü kapat" />
      <nav className="site-mobile-drawer" aria-label="Mobil kurumsal site menüsü">
        <div className="site-mobile-drawer-head">
          <img src="/brand/seflek-logo-navy.png" alt="Şeflek Tur" />
          <label htmlFor="site-mobile-navigation" aria-label="Menüyü kapat">
            <X size={18} />
            <span>Kapat</span>
          </label>
        </div>
        {siteNavLinks.map((item) => (
          <Link key={item.href} className={"className" in item ? item.className : undefined} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
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
    <section className="page-hero">
      <div className="page-hero-copy">
        <span className="new-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{body}</p>
        {children}
      </div>
      {imageUrl ? (
        <SkiperMotionFrame className="page-hero-visual" label="Şeflek Tur">
          <img src={imageUrl} alt={imageAlt ?? title} />
        </SkiperMotionFrame>
      ) : null}
    </section>
  );
}

export function FleetCard({ card, vip = false }: { card: SiteCard; vip?: boolean }) {
  return (
    <article className={vip ? "new-fleet-card vip-fleet-card hover-card" : "new-fleet-card branded-fleet-card hover-card"}>
      <div className="new-fleet-photo">
        {card.imageUrl ? <img src={card.imageUrl} alt={card.title} /> : null}
        {!vip ? (
          <span className="fleet-logo-decal">
            <img src="/brand/seflek-logo-navy.png" alt="" />
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
        {imageUrl ? <img src={imageUrl} alt={title} /> : null}
        <img className="mobile-app-logo" src="/brand/seflek-logo-navy.png" alt="Şeflek Tur" />
      </div>
    </section>
  );
}

export async function SiteFooter({ tickerItems }: { tickerItems: string[] }) {
  const content = await readSiteContent();
  const liveTickerItems = await getMarketTickerItems(tickerItems);
  const whatsappNumber = whatsappLinkNumber(content.whatsappNumber || content.contactPhone);

  return (
    <>
      <footer className="new-site-footer">
        <img src="/brand/seflek-logo-navy.png" alt="Şeflek Tur" />
        <div>
          <span>Şeflek Tur Turizm & Yolcu Taşımacılığı</span>
          <small>Kurumsal taşımacılık, belge takibi, sigorta ve operasyon standartları Şeflek Tur süreçleri kapsamında düzenli olarak kontrol edilir.</small>
        </div>
        <small className="footer-rights">Tüm marka, belge ve operasyon hakları saklıdır. Created & designed by CreativeWork Media.</small>
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

      <div className="new-rate-ticker" aria-label="Döviz ve akaryakıt bilgi bandı">
        <div className="ticker-visibility-shell">
          <SkiperTickerRail items={liveTickerItems} />
        </div>
      </div>
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
