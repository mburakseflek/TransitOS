import VipView from "@/app/seflektur/views/VipView";
import { createCorporateMetadata } from "@/app/seflektur/seo";

export const metadata = createCorporateMetadata({
  title: "VIP Transfer İstanbul | Şeflek Tur",
  description:
    "Şeflek Tur, İstanbul'da Mercedes-Benz Vito, Volkswagen Transporter, Mercedes-Benz Sprinter ve Mercedes-Benz E200 ile VIP transfer ve özel yolculuk hizmetleri sunar.",
  path: "/seflektur/vip"
});

export default function Page() { return <VipView />; }
