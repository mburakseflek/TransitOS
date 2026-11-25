import ContactView from "@/app/seflektur/views/ContactView";
import { createCorporateMetadata } from "@/app/seflektur/seo";

export const metadata = createCorporateMetadata({
  title: "Şeflek Tur İletişim | İstanbul Servis ve VIP Transfer",
  description:
    "İstanbul personel servisi, okul servisi, VIP transfer ve kurumsal taşımacılık talepleriniz için Şeflek Tur iletişim bilgilerine ulaşın.",
  path: "/seflektur/iletisim"
});

export default function Page() { return <ContactView />; }
