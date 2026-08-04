export default function TransitOSLoading() {
  return (
    <main className="app-opening-screen transitos-opening-screen" role="status" aria-live="polite">
      <section>
        <img src="/brand/seflek-logo-navy.png" alt="Şeflek Tur TransitOS" />
        <span className="opening-product">Transit<span>OS</span></span>
        <div className="opening-pulse" aria-hidden="true"><i /><i /><i /></div>
        <strong>Çalışma alanınız hazırlanıyor</strong>
        <span>Yalnızca yetkiniz olan bilgiler yükleniyor.</span>
      </section>
    </main>
  );
}
