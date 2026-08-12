import Image from "next/image";

export default function Loading() {
  return (
    <main className="app-opening-screen" role="status" aria-live="polite">
      <section>
        <Image className="loading-service-vehicle" src="/brand/transitos-service-vehicle.png" width={6001} height={2334} sizes="230px" priority alt="Şeflek Tur servis minibüsü" />
        <div className="opening-pulse" aria-hidden="true"><i /><i /><i /></div>
        <strong>Şeflek Tur hazırlanıyor</strong>
        <span>Lütfen kısa bir süre bekleyin.</span>
      </section>
    </main>
  );
}
