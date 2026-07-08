import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { submitServiceRequest } from "@/app/site-actions";
import { createCorporateMetadata } from "@/app/seflektur/seo";

export const metadata = createCorporateMetadata({
  title: "Şeflek Tur Hizmet Talebi | Personel Servisi, Okul Servisi ve VIP Transfer",
  description:
    "İstanbul personel servisi, okul servisi, turizm, günlük yolculuk ve VIP transfer ihtiyacınız için Şeflek Tur hizmet talep formunu doldurun.",
  path: "/seflektur/teklif"
});

export default async function ServiceRequestPage({ searchParams }: { searchParams?: Promise<{ sent?: string }> }) {
  const params = await searchParams;
  const sent = params?.sent === "1";

  return (
    <main className="site-page form-site-page">
      <Link className="form-back" href="/seflektur">Şeflek Tur sitesine dön</Link>
      <section className="site-form-shell">
        <div className="site-form-copy">
          <span className="site-eyebrow">Hizmet talebi</span>
          <h1>Servis, turizm veya VIP yolculuk ihtiyacınızı bize iletin.</h1>
          <p>
            Yolcu sayısı, güzergah ve hizmet tipini paylaşın. Şeflek Tur ekibi ihtiyacınıza göre planlama ve teklif çalışması hazırlasın.
          </p>
          {sent ? (
            <div className="success-note">
              <CheckCircle2 size={20} />
              Talebiniz alındı. Yönetici panelinde görüntülenebilir.
            </div>
          ) : null}
        </div>

        <form className="site-form-card" action={submitServiceRequest}>
          <label>
            Şirket / kişi adı
            <input name="companyName" required placeholder="Örn. ABC A.Ş." />
          </label>
          <label>
            İletişim kişisi
            <input name="contactPerson" required placeholder="Ad Soyad" />
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
            Hizmet tipi
            <select name="serviceType" defaultValue="Personel Taşımacılığı">
              <option>Personel Taşımacılığı</option>
              <option>Öğrenci ve Okul Taşımacılığı</option>
              <option>Turizm / Gezi Turu</option>
              <option>Günlük Genel Yolculuk</option>
              <option>VIP Yolculuk</option>
            </select>
          </label>
          <label>
            Yolcu sayısı
            <input name="passengerCount" placeholder="Örn. 42 personel" />
          </label>
          <label className="wide">
            Güzergah / rota bilgisi
            <textarea name="routeInfo" rows={3} placeholder="Başlangıç, varış, ara duraklar ve çalışma saatleri..." />
          </label>
          <label className="wide">
            Ek not
            <textarea name="note" rows={4} placeholder="Dönemsel mi, günlük mü, vardiya bilgisi, özel beklentiler..." />
          </label>
          <button className="site-primary" type="submit">Talebi gönder</button>
        </form>
      </section>
    </main>
  );
}
