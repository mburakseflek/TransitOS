import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sayfa Bulunamadı | Şeflek Tur",
  description: "Aradığınız Şeflek Tur sayfası bulunamadı. Kurumsal hizmetler, filo, VIP transfer ve iletişim sayfalarına dönebilirsiniz.",
  robots: {
    index: false,
    follow: true
  }
};

export default function SeflekTurNotFound() {
  return (
    <main className="site-page form-site-page">
      <section className="site-form-shell">
        <div className="site-form-copy">
          <span className="site-eyebrow">Şeflek Tur</span>
          <h1>Aradığınız sayfa bulunamadı.</h1>
          <p>Kurumsal site akışına dönerek hizmetler, filo, VIP transfer ve iletişim bölümlerini inceleyebilirsiniz.</p>
          <Link className="site-primary" href="/seflektur">
            Şeflek Tur sitesine dön
          </Link>
        </div>
      </section>
    </main>
  );
}
