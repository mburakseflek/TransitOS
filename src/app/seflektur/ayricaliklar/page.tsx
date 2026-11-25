import PrivilegesView from "@/app/seflektur/views/PrivilegesView";
import { createCorporateMetadata } from "@/app/seflektur/seo";

export const metadata = createCorporateMetadata({
  title: "Şeflek Tur Ayrıcalıkları | 7/24 Kurumsal Taşımacılık",
  description:
    "Şeflek Tur; 7/24 ulaşılabilirlik, evrak takibi, filo disiplini, güvenli hizmet standardı ve TransitOS destekli raporlama ile kurumsal taşımacılık hizmeti sunar.",
  path: "/seflektur/ayricaliklar"
});

export default function Page() { return <PrivilegesView />; }
