import StandardsView from "@/app/seflektur/views/StandardsView";
import { createCorporateMetadata } from "@/app/seflektur/seo";

export const metadata = createCorporateMetadata({
  title: "Şeflek Tur Belgeler ve Standartlar | SRC, D2, TÜRSAB ve İBB Güzergah",
  description:
    "Şeflek Tur; SRC, psikoteknik, D2, TÜRSAB, İBB güzergah belgeleri, trafik sigortası, koltuk sigortası ve araç evrak kontrolleriyle profesyonel taşımacılık standardı sunar.",
  path: "/seflektur/standartlar"
});

export default function Page() { return <StandardsView />; }
