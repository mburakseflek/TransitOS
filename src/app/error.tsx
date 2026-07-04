"use client";

import Link from "next/link";
import { AlertTriangle, Database, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function AppError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
  const isDatabaseError =
    error.message.includes("PrismaClientInitializationError") ||
    error.message.includes("Can't reach database server") ||
    error.message.includes("P1000") ||
    error.message.includes("P1001");
  const debugMessage = error.message || error.digest || "Detay alınamadı. Terminaldeki kırmızı hata satırını kontrol edin.";

  async function retry() {
    if (!isDatabaseError) {
      reset();
      return;
    }

    setIsRecovering(true);
    setRecoveryMessage("Veri merkezi başlatılıyor...");
    try {
      const response = await fetch("/api/system/database/start", { method: "POST" });
      const result = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(result?.message ?? "Veri merkezi başlatılamadı.");
      }
      setRecoveryMessage("Bağlantı hazır. TransitOS açılıyor...");
      reset();
    } catch (recoveryError) {
      setRecoveryMessage(
        recoveryError instanceof Error
          ? recoveryError.message
          : "Veri merkezi başlatılamadı. Başlatma dosyasını kullanın."
      );
    } finally {
      setIsRecovering(false);
    }
  }

  return (
    <main className="system-error-page">
      <section className="system-error-card">
        <div className="system-error-icon">
          {isDatabaseError ? <Database size={30} /> : <AlertTriangle size={30} />}
        </div>
        <span className="new-eyebrow">TransitOS</span>
        <h1>{isDatabaseError ? "Veri merkezi şu anda kapalı" : "Beklenmeyen bir hata oluştu"}</h1>
        <p>
          {isDatabaseError
            ? "TransitOS paneli açık fakat yerel veri merkezi durmuş. Aşağıdaki düğme veri merkezini yeniden başlatıp paneli otomatik olarak açar."
            : "Sayfa yüklenirken bir sorun oluştu. Sayfayı yeniden deneyebilir veya ana sayfaya dönebilirsiniz."}
        </p>
        {recoveryMessage ? <p className="system-error-status" role="status">{recoveryMessage}</p> : null}
        <div className="system-error-actions">
          <button type="button" onClick={retry} disabled={isRecovering}>
            <RefreshCw size={17} />
            {isRecovering
              ? "Başlatılıyor..."
              : isDatabaseError
                ? "Veri merkezini başlat"
                : "Yeniden dene"}
          </button>
          <Link href="/">Ana girişe dön</Link>
        </div>
        {isDatabaseError ? (
          <small>
            Bağlantı adresi: <strong>127.0.0.1:55432</strong>. Mevcut kayıtlar korunarak yeniden bağlanır.
          </small>
        ) : null}
        <small className="system-error-debug">
          Hata detayı: <strong>{debugMessage}</strong>
        </small>
      </section>
    </main>
  );
}
