export default function Loading() {
  return (
    <main className="app-opening-screen" role="status" aria-live="polite">
      <section>
        <img src="/brand/seflek-logo-navy.png" alt="Şeflek Tur" />
        <div className="opening-pulse" aria-hidden="true"><i /><i /><i /></div>
        <strong>Şeflek Tur hazırlanıyor</strong>
        <span>Lütfen kısa bir süre bekleyin.</span>
      </section>
    </main>
  );
}
