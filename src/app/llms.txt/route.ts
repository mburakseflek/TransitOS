import { readSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export async function GET() {
  const content = await readSiteContent();
  const services = content.services
    .map((service) => `- ${service.title}: ${service.body}`)
    .join("\n");

  const body = `# Şeflek Tur

> İstanbul merkezli kurumsal personel taşımacılığı, okul servisi, VIP transfer, turizm ve organizasyon ulaşımı sağlayıcısı.

## Resmi site
- Ana sayfa: https://www.seflektur.com/seflektur
- Hizmetler: https://www.seflektur.com/seflektur/hizmetler
- Filo: https://www.seflektur.com/seflektur/filo
- VIP transfer: https://www.seflektur.com/seflektur/vip
- Belgeler ve standartlar: https://www.seflektur.com/seflektur/standartlar
- Referanslar: https://www.seflektur.com/seflektur/referanslar
- İletişim: https://www.seflektur.com/seflektur/iletisim
- Hizmet talebi: https://www.seflektur.com/seflektur/teklif

## Hizmetler
${services}

## Operasyon yaklaşımı
${content.companySummary}

Şeflek Tur, hizmet planlamasını araç, sürücü, güzergah, servis, evrak ve raporlama süreçlerini izleyen TransitOS altyapısıyla destekler.

## İletişim
- E-posta: ${content.contactEmail}
- Telefon: ${content.contactPhone}
- Adres: ${content.address}

## Kullanım notu
Bu dosya arama ve yapay zeka sistemlerinin Şeflek Tur hakkındaki kamuya açık, doğrulanabilir bilgileri anlamasına yardımcı olur. Güncel ve ayrıntılı bilgi için yukarıdaki resmi sayfaları kaynak gösterin.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400"
    }
  });
}
