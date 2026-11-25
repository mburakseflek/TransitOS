import ServicesView from "@/app/seflektur/views/ServicesView";
import { createCorporateMetadata } from "@/app/seflektur/seo";

export const metadata = createCorporateMetadata({
  title: "İstanbul Personel Servisi ve Okul Servisi | Şeflek Tur",
  description:
    "Şeflek Tur; İstanbul'da personel taşımacılığı, okul servisi, turizm, günlük yolculuk ve VIP transfer hizmetleri için güvenli ve planlı ulaşım çözümleri sunar.",
  path: "/seflektur/hizmetler"
});

export default function Page() { return <ServicesView />; }
