import Link from "next/link";
import { ArrowRight, Building2, LockKeyhole, MonitorCog, PhoneCall } from "lucide-react";
import { WhatsAppIcon } from "@/app/components/WhatsAppIcon";
import { SkiperMotionFrame } from "@/app/components/RegistryInterfaceKit";
import { readSiteContent } from "@/lib/site-content";

const heroFleetImage =
  "/site-media/hero-gateway.png";

export default async function HomePage() {
  const content = await readSiteContent();
  const whatsappNumber = whatsappLinkNumber(content.whatsappNumber || content.contactPhone);

  return (
    <main className="new-gateway">
      <img className="new-gateway-bg" src={content.gatewayImageUrl || heroFleetImage} alt="Şeflek Tur beyaz filo karşılama görseli" />
      <div className="new-gateway-shade" />

      <header className="new-gateway-nav">
        <Link className="navy-brand" href="/">
          <img src="/seflek-logo-white.png" alt="Şeflek Tur" />
        </Link>
        <div className="new-gateway-nav-actions">
          <Link href="/login?next=/site-admin">
            <LockKeyhole size={16} />
            Yönetici paneli
          </Link>
          <Link href="/seflektur/teklif">
            <PhoneCall size={16} />
            Teklif al
          </Link>
        </div>
      </header>

      <section className="new-gateway-content">
        <div className="new-gateway-copy">
          <span>Turizm & Yolcu Taşımacılığı</span>
          <h1>{content.heroTitle}</h1>
          <p>{content.heroSubtitle}</p>
        </div>

        <SkiperMotionFrame label="Giriş Seçimi">
          <div className="new-entry-grid" aria-label="Şeflek Tur giriş seçenekleri">
            <Link className="new-entry-card transitos-entry" href="/login?next=/transitos/dashboard">
              <MonitorCog size={26} />
              <strong>TransitOS</strong>
              <span>Operasyon, taşeron, araç ve hakediş paneline giriş.</span>
              <em>Uygulama arayüzüne gir <ArrowRight size={17} /></em>
            </Link>

            <Link className="new-entry-card seflektur-entry" href="/seflektur">
              <Building2 size={26} />
              <strong>{content.companyName}</strong>
              <span>Kurumsal hizmetler, filo, VIP yolculuk ve başvuru formları.</span>
              <em>Kurumsal siteye gir <ArrowRight size={17} /></em>
            </Link>
          </div>
        </SkiperMotionFrame>
      </section>

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
    </main>
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
