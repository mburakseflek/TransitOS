"use client";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body>
        <main className="system-error-page">
          <section className="system-error-card">
            <span className="new-eyebrow">TransitOS</span>
            <h1>Sayfa başlatılırken hata oluştu</h1>
            <p>Uygulama kabuğu yüklenirken bir sorun oluştu. Yeniden deneyebilir veya ana girişe dönebilirsiniz.</p>
            <div className="system-error-actions">
              <button type="button" onClick={reset}>Yeniden dene</button>
              <a href="/">Ana girişe dön</a>
            </div>
            <small className="system-error-debug">
              Hata detayı: <strong>{error.message || error.digest || "Detay alınamadı. Terminaldeki kırmızı hata satırını kontrol edin."}</strong>
            </small>
          </section>
        </main>
      </body>
    </html>
  );
}
