import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/app/components/WhatsAppIcon";
import { CorporateMobileNav } from "@/app/seflektur/CorporateMobileNav";
import { readSiteContent, SiteCard } from "@/lib/site-content";
import { MarketTicker } from "@/app/components/MarketTicker";
import { LanguagePicker } from "@/app/components/LanguagePicker";
import { type CorporateLocale, translate, corporateHref, controlCopy } from "@/lib/corporate-locale";

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

export function SiteHeader({ locale = "tr" }: { locale?: CorporateLocale }) {
  const t = (value: string) => translate(locale, value);
  return (
    <>
      <a className="site-skip-link" href="#main-content">{t("Ana içeriğe geç")}</a>
      <CorporateMobileNav locale={locale} copy={controlCopy(locale)} links={siteNavLinks.map(link => ({ ...link, href:corporateHref(locale, link.href), label:t(link.label) }))} />
      <header className="corp-v2-header">
        <div className="corp-v2-header-inner">
          <Link className="corp-v2-brand" href={corporateHref(locale, "/seflektur")} aria-label={t("Şeflek Tur ana sayfa")}>
            <img src="/brand/seflek-logo-navy.png" alt="Şeflek Tur" width="236" height="92" decoding="async" />
          </Link>
          <nav className="corp-v2-nav" aria-label={t("Kurumsal site menüsü")}>
            <Link href={corporateHref(locale, "/seflektur/hizmetler")}>{t("Hizmetler")}</Link>
            <Link href={corporateHref(locale, "/seflektur/filo")}>{t("Filo")}</Link>
            <Link href={corporateHref(locale, "/seflektur/vip")}>{t("VIP Transfer")}</Link>
            <Link href={corporateHref(locale, "/seflektur/standartlar")}>{t("Standartlarımız")}</Link>
            <Link href={corporateHref(locale, "/seflektur/referanslar")}>{t("Referanslar")}</Link>
            <Link href={corporateHref(locale, "/seflektur/iletisim")}>{t("İletişim")}</Link>
          </nav>
          <div className="corp-v2-header-actions">
            <LanguagePicker current={locale} />
            <Link className="corp-v2-portal-link" href={corporateHref(locale, "/seflektur/transitos")}>{t("TransitOS")}</Link>
            <Link className="corp-v2-header-cta" href={corporateHref(locale, "/seflektur/teklif")}>{t("Teklif alın ")}<ArrowRight size={16} /></Link>
          </div>
        </div>
      </header>
    </>
  );
}

export function PageHero({
  locale = "tr",
  eyebrow,
  title,
  body,
  imageUrl,
  imageAlt,
  children
}: {
  locale?: CorporateLocale;
  eyebrow: string;
  title: string;
  body: string;
  imageUrl?: string;
  imageAlt?: string;
  children?: ReactNode;
}) {
  const t = (value: string) => translate(locale, value);
  return (
    <section className="corp-v2-hero" id="main-content">
      <div className="corp-v2-hero-copy">
        <span className="corp-v2-kicker">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{body}</p>
        {children}
        <div className="corp-v2-hero-meta" aria-label={t("Şeflek Tur hizmet özellikleri")}>
          <span><b>{t("7/24")}</b>{t(" operasyon desteği")}</span>
          <span><b>{t("İstanbul")}</b>{t(" merkezli planlama")}</span>
          <span><b>{t("TransitOS")}</b>{t(" ile takip")}</span>
        </div>
      </div>
      {imageUrl ? (
        <div className="corp-v2-hero-visual">
          <img src={imageUrl} alt={imageAlt ?? title} width="1280" height="960" decoding="async" fetchPriority="high" />
          <div className="corp-v2-image-note"><span>{t("Şeflek Tur")}</span><strong>{t("Güvenli ulaşım, kontrollü operasyon.")}</strong></div>
        </div>
      ) : null}
    </section>
  );
}

export function FleetCard({ card, vip = false, locale = "tr" }: { card: SiteCard; vip?: boolean; locale?: CorporateLocale }) {
  const t = (value: string) => translate(locale, value);
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
        <span className="card-more">{t("Detayları incele ")}<ArrowRight size={15} /></span>
      </div>
    </article>
  );
}

export function MobileAppPromo({
  locale = "tr",
  title,
  body,
  imageUrl
}: {
  locale?: CorporateLocale;
  title: string;
  body: string;
  imageUrl: string;
}) {
  const t = (value: string) => translate(locale, value);
  return (
    <section className="mobile-app-promo hover-card">
      <div>
        <span className="new-eyebrow">{t("TransitOS Mobile")}</span>
        <h2>{title}</h2>
        <p>{body}</p>
        <div className="store-badges">
          <span>{t("App Store")}</span>
          <span>{t("Google Play")}</span>
        </div>
      </div>
      <div className="mobile-app-visual">
        {imageUrl ? <img src={imageUrl} alt={title} width="720" height="720" loading="lazy" decoding="async" /> : null}
        <img className="mobile-app-logo" src="/brand/seflek-logo-navy.png" alt="Şeflek Tur" width="236" height="92" loading="lazy" decoding="async" />
      </div>
    </section>
  );
}

export async function SiteFooter({ tickerItems, locale = "tr" }: { tickerItems: string[]; locale?: CorporateLocale }) {
  const t = (value: string) => translate(locale, value);
  const content = await readSiteContent();
  const whatsappNumber = whatsappLinkNumber(content.whatsappNumber || content.contactPhone);

  return (
    <>
      <footer className="corp-v2-footer">
        <div className="corp-v2-footer-brand">
          <img src="/seflek-logo-white.png" alt="Şeflek Tur" width="236" height="92" loading="lazy" decoding="async" />
          <p>{t("İstanbul merkezli kurumsal personel, okul, turizm ve VIP taşımacılık çözümleri.")}</p>
        </div>
        <div className="corp-v2-footer-links">
          <strong>{t("Şeflek Tur")}</strong>
          <Link href={corporateHref(locale, "/seflektur/hizmetler")}>{t("Hizmetler")}</Link>
          <Link href={corporateHref(locale, "/seflektur/filo")}>{t("Filo")}</Link>
          <Link href={corporateHref(locale, "/seflektur/referanslar")}>{t("Referanslar")}</Link>
        </div>
        <div className="corp-v2-footer-links">
          <strong>{t("İletişim")}</strong>
          <a href={`tel:${content.contactPhone.replace(/\s/g, "")}`}><Phone size={15} /> {content.contactPhone}</a>
          <a href={`mailto:${content.contactEmail}`}>{content.contactEmail}</a>
          <Link href={corporateHref(locale, "/seflektur/teklif")}>{t("Hizmet talebi")}</Link>
        </div>
        <small className="corp-v2-footer-rights">© {new Date().getFullYear()} Şeflek Tur. {t("Tüm hakları saklıdır.")}</small>
      </footer>

      {whatsappNumber ? (
        <a
          className="whatsapp-float"
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noreferrer"
          aria-label={t("WhatsApp sohbeti başlat")}
        >
          <WhatsAppIcon />
          <span>{t("WhatsApp")}</span>
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
