import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { submitCarrierApplication } from "@/app/site-actions";

export default async function CarrierApplicationPage({ searchParams }: { searchParams?: Promise<{ sent?: string }> }) {
  const params = await searchParams;
  const sent = params?.sent === "1";

  return (
    <main className="site-page form-site-page">
      <Link className="form-back" href="/seflektur">Şeflek Tur sitesine dön</Link>
      <section className="site-form-shell">
        <div className="site-form-copy">
          <span className="site-eyebrow">Taşımacı başvurusu</span>
          <h1>Şeflek Tur ile çalışmak isteyen taşımacılar için ön kayıt.</h1>
          <p>
            Araç tiplerinizi, çalışma bölgenizi ve iletişim bilgilerinizi paylaşın. Operasyon ekibi uygun ihtiyaçlarda sizinle iletişime geçsin.
          </p>
          {sent ? (
            <div className="success-note">
              <CheckCircle2 size={20} />
              Başvurunuz alındı. Yönetici panelinde görüntülenebilir.
            </div>
          ) : null}
        </div>

        <form className="site-form-card" action={submitCarrierApplication}>
          <label>
            Firma / şahıs adı
            <input name="companyName" required placeholder="Örn. ABC Turizm" />
          </label>
          <label>
            Yetkili kişi
            <input name="authorizedPerson" required placeholder="Ad Soyad" />
          </label>
          <label>
            Telefon
            <input name="phone" required placeholder="+90 (5xx) xxx xx xx" />
          </label>
          <label>
            E-posta
            <input name="email" type="email" placeholder="ornek@firma.com" />
          </label>
          <label>
            Çalışma bölgesi
            <input name="city" placeholder="İstanbul Avrupa Yakası, Beylikdüzü..." />
          </label>
          <label>
            Araç sayısı
            <input name="vehicleCount" placeholder="Örn. 3" />
          </label>
          <label className="wide">
            Araç tipleri
            <textarea name="vehicleTypes" rows={3} placeholder="Sprinter 16+1, Crafter, Transit..." />
          </label>
          <label className="wide">
            Not
            <textarea name="note" rows={4} placeholder="Çalışma saatleri, uygun bölgeler, belge durumu..." />
          </label>
          <button className="site-primary" type="submit">Başvuruyu gönder</button>
        </form>
      </section>
    </main>
  );
}
