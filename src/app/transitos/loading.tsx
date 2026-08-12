import Image from "next/image";

export default function TransitOSLoading() {
  return (
    <main className="app-opening-screen transitos-opening-screen" role="status" aria-live="polite">
      <section>
        <Image className="loading-service-vehicle" src="/brand/transitos-service-vehicle.png" width={6001} height={2334} sizes="230px" priority alt="Şeflek Tur servis minibüsü" />
        <span className="opening-product">Transit<span>OS</span></span>
        <div className="opening-pulse" aria-hidden="true"><i /><i /><i /></div>
        <strong>Çalışma alanınız hazırlanıyor</strong>
        <span>Yalnızca yetkiniz olan bilgiler yükleniyor.</span>
      </section>
    </main>
  );
}
