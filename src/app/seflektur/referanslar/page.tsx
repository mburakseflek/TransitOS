import ReferencesView from "@/app/seflektur/views/ReferencesView";
import { createCorporateMetadata } from "@/app/seflektur/seo";

export const metadata = createCorporateMetadata({
  title: "Şeflek Tur Referanslar ve İş Ortakları",
  description:
    "Şeflek Tur referansları ve iş ortakları; kurumsal personel taşımacılığı, servis operasyonları, turizm ve özel ulaşım hizmetlerinde izlenebilir çalışma yaklaşımını gösterir.",
  path: "/seflektur/referanslar"
});

export default function Page() { return <ReferencesView />; }
