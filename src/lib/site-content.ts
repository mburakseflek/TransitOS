import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/db";

export type SiteCard = {
  title: string;
  subtitle: string;
  body: string;
  imageUrl: string;
  meta?: string;
};

export type SiteBlock = {
  id: string;
  type: "text" | "image" | "card";
  title: string;
  body: string;
  imageUrl: string;
};

export type CustomPage = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  heroImageUrl: string;
  blocks: SiteBlock[];
};

export type CompanyDetail = {
  id: string;
  label: string;
  value: string;
  action: "none" | "phone" | "email" | "map";
};

export type SiteContent = {
  companyName: string;
  brandLine: string;
  heroTitle: string;
  heroSubtitle: string;
  gatewayImageUrl: string;
  homeHeroImageUrl: string;
  fleetHeroImageUrl: string;
  vipHeroImageUrl: string;
  companySummary: string;
  contactPhone: string;
  contactEmail: string;
  whatsappNumber: string;
  address: string;
  taxOffice: string;
  taxNumber: string;
  companyDetails: CompanyDetail[];
  fleet: SiteCard[];
  vipFleet: SiteCard[];
  services: SiteCard[];
  privileges: SiteCard[];
  references: SiteCard[];
  transitosTitle: string;
  transitosBody: string;
  mobileAppTitle: string;
  mobileAppBody: string;
  mobileAppImageUrl: string;
  customPages: CustomPage[];
  tickerItems: string[];
};

const dataDir = path.join(process.cwd(), "content");
const contentPath = path.join(dataDir, "site-content.json");
const carrierApplicationsPath = path.join(dataDir, "carrier-applications.json");
const serviceRequestsPath = path.join(dataDir, "service-requests.json");
const siteContentKey = "site-content";

const siteImageAliases: Record<string, string> = {
  "/uploads/1782067215389-dagqbpclyba.png": "/site-media/hero-gateway.png",
  "/uploads/1782067229696-elulxybflp9.png": "/site-media/hero-home.png",
  "/uploads/1782069507162-64rsn1day4e.png": "/site-media/hero-fleet.png",
  "/uploads/1782068694955-3w1t0qyetxa.png": "/site-media/transitos-mobile.png",
  "/uploads/1782028010544-s6gqbp67il.webp": "/site-media/fleet-sprinter.webp",
  "/uploads/1782028194348-mruo5ibad6c.webp": "/site-media/fleet-crafter.webp",
  "/uploads/1782027978943-4l8tjr9sqq5.webp": "/site-media/fleet-master.webp",
  "/uploads/1782028264865-7qtg12rleno.webp": "/site-media/fleet-transit.webp",
  "/uploads/1782028296103-igo2dqr7yjs.webp": "/site-media/fleet-ducato.webp",
  "/uploads/1782029262097-250ymokn1ge.webp": "/site-media/fleet-midibus.webp",
  "/uploads/1782028441814-ka6k9ds2m9.webp": "/site-media/fleet-travego.webp",
  "/uploads/1782029481424-33turrfuxpa.webp": "/site-media/vip-vito.webp",
  "/uploads/1782029556232-xv9htcj0qv9.webp": "/site-media/vip-transporter.webp",
  "/uploads/1782029647090-y0iuc6yo5a.webp": "/site-media/vip-sprinter.webp",
  "/uploads/1782029807960-gtyvurpui4q.webp": "/site-media/vip-e200.webp",
  "/uploads/1782067503969-i9k64a1jmy.png": "/site-media/service-school.png",
  "/uploads/1782067946574-dq9t74skzqf.png": "/site-media/service-personnel.png",
  "/uploads/1782068251487-tlk8svd5bt.png": "/site-media/service-tourism.png",
  "/uploads/1782068382445-811b893rsvi.png": "/site-media/service-daily.png",
  "/uploads/1782068614952-w1vwsjn1l1a.png": "/site-media/service-vip.png",
  "/uploads/1782059453243-ai6rzmcn7od.png": "/site-media/ref-mcdonalds.png",
  "/uploads/1782059462659-1drp99mjz5y.png": "/site-media/ref-kfc.png",
  "/uploads/1782059474609-h3eut8mk6qu.png": "/site-media/ref-pizzahut.png",
  "/uploads/1782059484495-3xad0b1zayp.png": "/site-media/ref-cinemaximum.png",
  "/uploads/1782059498405-x31r3hky4jp.png": "/site-media/ref-sushico.png",
  "/uploads/1782059610223-snq259tzbed.png": "/site-media/ref-iett.png",
  "/uploads/1782059617922-i3inv944zm.png": "/site-media/ref-little-caesars.png",
  "/uploads/1782059625215-dxrohbv8f8w.png": "/site-media/ref-burger-yiyelim.png",
  "/uploads/1782059646859-hnpzryh8kcs.png": "/site-media/ref-divane.png",
  "/uploads/1782059656603-0say6zn2z4dg.png": "/site-media/ref-happy-moons.png",
  "/uploads/1782059663205-oqih99etej.png": "/site-media/ref-midpoint.png",
  "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=2200&q=86": "/site-media/hero-gateway.png",
  "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=2200&q=86": "/site-media/hero-fleet.png",
  "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=2200&q=86": "/site-media/hero-vip.png",
  "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1600&q=86": "/site-media/transitos-mobile.png"
};

const fleetImagesByTitle: Record<string, string> = {
  "mercedes-benz sprinter": "/site-media/fleet-sprinter.webp",
  "mercedes benz sprinter": "/site-media/fleet-sprinter.webp",
  "volkswagen crafter volt": "/site-media/fleet-crafter.webp",
  "renault master": "/site-media/fleet-master.webp",
  "ford transit": "/site-media/fleet-transit.webp",
  "fiat ducato": "/site-media/fleet-ducato.webp",
  "otokar sultan comfort/giga": "/site-media/fleet-midibus.webp",
  "mercedes benz travego": "/site-media/fleet-travego.webp",
  "mercedes-benz travego & tourismo": "/site-media/fleet-travego.webp",
  "renault master / fiat ducato": "/site-media/fleet-master.webp",
  "volkswagen crafter volt / ford transit": "/site-media/fleet-crafter.webp"
};

const vipImagesByTitle: Record<string, string> = {
  "mercedes-benz vito": "/site-media/vip-vito.webp",
  "volkswagen transporter": "/site-media/vip-transporter.webp",
  "mercedes-benz sprinter": "/site-media/vip-sprinter.webp",
  "mercedes e200d": "/site-media/vip-e200.webp",
  "mercedes-benz e200": "/site-media/vip-e200.webp"
};

const serviceImagesByTitle: Record<string, string> = {
  "öğrenci ve okul taşımacılığı": "/site-media/service-school.png",
  "personel taşımacılığı": "/site-media/service-personnel.png",
  "turizm ve gezi turları": "/site-media/service-tourism.png",
  "günlük genel yolculuk hizmetleri": "/site-media/service-daily.png",
  "vip yolculuk": "/site-media/service-vip.png"
};

const referenceImagesByTitle: Record<string, string> = {
  "mcdonald's": "/site-media/ref-mcdonalds.png",
  "kfc": "/site-media/ref-kfc.png",
  "pizza hut": "/site-media/ref-pizzahut.png",
  "cinemaximum": "/site-media/ref-cinemaximum.png",
  "sushico": "/site-media/ref-sushico.png",
  "iett": "/site-media/ref-iett.png",
  "little caesars": "/site-media/ref-little-caesars.png",
  "burger yiyelim": "/site-media/ref-burger-yiyelim.png",
  "divane lounge": "/site-media/ref-divane.png",
  "happy moons": "/site-media/ref-happy-moons.png",
  "midpoint": "/site-media/ref-midpoint.png"
};

export const defaultSiteContent: SiteContent = {
  companyName: "Şeflek Tur",
  brandLine: "Turizm & Yolcu Taşımacılığı",
  heroTitle: "Şeflek Tur Turizm & Yolcu Taşımacılığı",
  heroSubtitle:
    "Kurumsal personel taşımacılığı, okul servisleri, VIP transfer, turizm ve günlük yolculuk hizmetlerinde güvenli, izlenebilir ve profesyonel operasyon.",
  gatewayImageUrl: "/site-media/hero-gateway.png",
  homeHeroImageUrl: "/site-media/hero-home.png",
  fleetHeroImageUrl: "/site-media/hero-fleet.png",
  vipHeroImageUrl: "/site-media/hero-vip.png",
  companySummary:
    "Şeflek Tur; İstanbul merkezli servis, turizm ve yolcu taşımacılığı süreçlerini modern filo yönetimi, düzenli operasyon takibi ve 7/24 ulaşılabilir iletişim anlayışıyla yürütür. TransitOS altyapısı sayesinde araç, güzergah, hakediş ve operasyon bilgileri kontrollü şekilde takip edilir.",
  contactPhone: "+90 (000) 000 00 00",
  contactEmail: "info@seflektur.com",
  whatsappNumber: "+90 (000) 000 00 00",
  address: "İstanbul / Türkiye",
  taxOffice: "Büyükçekmece",
  taxNumber: "0000000000",
  companyDetails: [],
  fleet: [
    {
      title: "Mercedes-Benz Sprinter",
      subtitle: "16+1 / 19+1 / 21+1 servis çözümleri",
      body: "Personel, öğrenci ve kurumsal servis operasyonları için konforlu, yüksek tavanlı ve düzenli takip edilebilir filo seçeneği.",
      imageUrl: "/site-media/fleet-sprinter.webp",
      meta: "Servis / Minibüs"
    },
    {
      title: "Mercedes-Benz Travego & Tourismo",
      subtitle: "Uzun yol ve turizm otobüsleri",
      body: "Gezi turları, şehirler arası organizasyonlar ve kalabalık gruplar için yüksek konforlu otobüs planlaması.",
      imageUrl: "/site-media/fleet-travego.webp",
      meta: "Turizm / Otobüs"
    },
    {
      title: "Renault Master / Fiat Ducato",
      subtitle: "Esnek servis kapasitesi",
      body: "Farklı personel sayıları ve güzergah yoğunlukları için ekonomik, çevik ve düzenli servis seçenekleri.",
      imageUrl: "/site-media/fleet-master.webp",
      meta: "Servis / Minibüs"
    },
    {
      title: "Volkswagen Crafter Volt / Ford Transit",
      subtitle: "Kurumsal filo destek araçları",
      body: "Personel taşımacılığı, vardiya operasyonları ve günlük genel yolculuk hizmetlerinde yüksek kullanılabilirlik.",
      imageUrl: "/site-media/fleet-crafter.webp",
      meta: "Kurumsal Servis"
    }
  ],
  vipFleet: [
    {
      title: "Mercedes-Benz Vito",
      subtitle: "VIP transfer ve özel yolculuk",
      body: "Misafir karşılama, yönetici transferleri ve özel organizasyonlar için sessiz, konforlu ve prestijli ulaşım.",
      imageUrl: "/site-media/vip-vito.webp",
      meta: "VIP"
    },
    {
      title: "Volkswagen Transporter",
      subtitle: "Konforlu grup transferi",
      body: "Havalimanı, otel, toplantı ve günlük özel ulaşım talepleri için planlanabilir VIP araç alternatifi.",
      imageUrl: "/site-media/vip-transporter.webp",
      meta: "VIP"
    },
    {
      title: "Mercedes-Benz E200",
      subtitle: "Yönetici sınıfı sedan",
      body: "Tekil VIP transferlerde kurumsal temsil gücü yüksek, konfor odaklı sedan ulaşım hizmeti.",
      imageUrl: "/site-media/vip-e200.webp",
      meta: "Executive"
    }
  ],
  services: [
    {
      title: "Öğrenci ve Okul Taşımacılığı",
      subtitle: "Güvenli servis planlaması",
      body: "Okul saatleri, veli beklentileri ve güzergah güvenliği dikkate alınarak düzenlenen öğrenci taşıma hizmetleri.",
      imageUrl: "/site-media/service-school.png",
      meta: "Okul"
    },
    {
      title: "Personel Taşımacılığı",
      subtitle: "Vardiya ve güzergah yönetimi",
      body: "Sabah, akşam, gece ve mesai servisleri için kurumsal güzergah planlama ve araç atama süreçleri.",
      imageUrl: "/site-media/service-personnel.png",
      meta: "Kurumsal"
    },
    {
      title: "Turizm ve Gezi Turları",
      subtitle: "Planlı grup ulaşımı",
      body: "Şehir içi ve şehir dışı gezi, tur, etkinlik ve organizasyon taşımacılığı.",
      imageUrl: "/site-media/service-tourism.png",
      meta: "Turizm"
    },
    {
      title: "Günlük Genel Yolculuk Hizmetleri",
      subtitle: "Tek seferlik veya dönemsel ulaşım",
      body: "Firma, kurum veya şahısların günlük ulaşım ihtiyaçlarına özel planlanan esnek servis çözümleri.",
      imageUrl: "/site-media/service-daily.png",
      meta: "Günlük"
    },
    {
      title: "VIP Yolculuk",
      subtitle: "Özel transfer deneyimi",
      body: "Yönetici, misafir ve özel davet transferlerinde prestijli araçlarla kontrollü ulaşım.",
      imageUrl: "/site-media/service-vip.png",
      meta: "VIP"
    }
  ],
  privileges: [
    {
      title: "7/24 İletişim ve Ulaşılabilirlik",
      subtitle: "Operasyon sırasında hızlı destek",
      body: "Araç, sürücü, güzergah ve yolcu süreçlerinde her an ulaşılabilir operasyon yaklaşımı.",
      imageUrl: "",
      meta: "Destek"
    },
    {
      title: "TransitOS ile İzlenebilir Operasyon",
      subtitle: "Plan, rota ve hakediş kontrolü",
      body: "Servis günleri, araç atamaları, raporlar ve hakediş süreçleri dijital altyapı üzerinden takip edilir.",
      imageUrl: "",
      meta: "Dijital"
    },
    {
      title: "Kurumsal Filo Disiplini",
      subtitle: "Araç ve evrak takibi",
      body: "Filo, sürücü ve evrak süreçleri düzenli kontrol edilerek kurumsal taşımacılık standardı korunur.",
      imageUrl: "",
      meta: "Filo"
    }
  ],
  references: [
    {
      title: "McDonald's",
      subtitle: "Referans marka",
      body: "Kurumsal yolcu taşımacılığı ve operasyonel hizmet ağı içinde takip edilebilen iş ortaklığı referansı.",
      imageUrl: "",
      meta: "Gıda & Perakende"
    },
    {
      title: "KFC",
      subtitle: "Referans marka",
      body: "Servis ve dönemsel ulaşım planlarında kurumsal marka operasyonu.",
      imageUrl: "",
      meta: "Gıda & Perakende"
    },
    {
      title: "Pizza Hut",
      subtitle: "Referans marka",
      body: "Şehir içi operasyon, personel ve saha ulaşımı süreçlerinde planlı taşıma desteği.",
      imageUrl: "",
      meta: "Gıda & Perakende"
    },
    {
      title: "Cinemaximum",
      subtitle: "Referans marka",
      body: "Etkinlik, vardiya ve kurumsal ulaşım süreçlerine uygun operasyon modeli.",
      imageUrl: "",
      meta: "Eğlence"
    },
    {
      title: "Adana İl Sınırı",
      subtitle: "Referans marka",
      body: "Restoran ve hizmet sektörü operasyonları için düzenli ulaşım planı.",
      imageUrl: "",
      meta: "Restoran"
    },
    {
      title: "SushiCo",
      subtitle: "Referans marka",
      body: "Kurumsal saha ve personel ulaşımı kapsamında takip edilebilir hizmet yaklaşımı.",
      imageUrl: "",
      meta: "Restoran"
    },
    {
      title: "İETT",
      subtitle: "Kurumsal iş ortağı",
      body: "Toplu ulaşım ve şehir içi hareketlilik alanındaki kurumsal temaslar için referans alanı.",
      imageUrl: "",
      meta: "Ulaşım"
    },
    {
      title: "Little Caesars",
      subtitle: "Referans marka",
      body: "Restoran zinciri operasyonları için planlanabilir yolcu taşıma ve servis desteği.",
      imageUrl: "",
      meta: "Gıda & Perakende"
    },
    {
      title: "Burger Yiyelim",
      subtitle: "Referans marka",
      body: "Günlük operasyon ve personel hareketliliği için esnek taşıma yaklaşımı.",
      imageUrl: "",
      meta: "Restoran"
    },
    {
      title: "Divane Lounge",
      subtitle: "Referans marka",
      body: "Misafir, ekip ve etkinlik taşımacılığına uygun kurumsal hizmet modeli.",
      imageUrl: "",
      meta: "Lounge"
    },
    {
      title: "Happy Moons",
      subtitle: "Referans marka",
      body: "Personel ve operasyonel ulaşım planları için referans marka alanı.",
      imageUrl: "",
      meta: "Restoran"
    },
    {
      title: "Midpoint",
      subtitle: "Referans marka",
      body: "Kurumsal restoran operasyonları için ulaşım ve servis planlama desteği.",
      imageUrl: "",
      meta: "Restoran"
    },
    {
      title: "Tetik Tur",
      subtitle: "İş ortağı",
      body: "Turizm ve yolcu taşımacılığı alanında operasyonel iş ortaklığı alanı.",
      imageUrl: "",
      meta: "Turizm"
    },
    {
      title: "Akkurtlar Tur",
      subtitle: "İş ortağı",
      body: "Servis ve turizm taşımacılığı ağında iş ortağı referansı.",
      imageUrl: "",
      meta: "Turizm"
    }
  ],
  transitosTitle: "TransitOS ile operasyonu görünür hale getirin",
  transitosBody:
    "TransitOS, Şeflek Tur operasyonunda taşeron, araç, sürücü, güzergah, hakediş, gider, rota ve rapor süreçlerini tek merkezde toplamaya yardımcı olan özel yönetim altyapısıdır.",
  mobileAppTitle: "TransitOS Mobil App çok yakında uygulama mağazalarında",
  mobileAppBody:
    "Şeflek Tur operasyonlarını mobil cihazlardan takip etmeyi sağlayacak TransitOS Mobil App yakında iOS ve Android uygulama mağazalarında yerini alacak.",
  mobileAppImageUrl: "/site-media/transitos-mobile.png",
  customPages: [
    {
      id: "kurumsal-yolculuk",
      title: "Kurumsal Yolculuk Planlama",
      slug: "kurumsal-yolculuk",
      summary: "Şirketinizin servis ve transfer ihtiyaçları için özel planlama yaklaşımı.",
      heroImageUrl: "/site-media/hero-home.png",
      blocks: [
        {
          id: "kurumsal-yolculuk-metin",
          type: "text",
          title: "İhtiyaca göre planlanan taşıma modeli",
          body: "Personel sayısı, vardiya düzeni, güzergah yoğunluğu ve araç kapasitesine göre ölçülü bir taşıma planı hazırlanır.",
          imageUrl: ""
        },
        {
          id: "kurumsal-yolculuk-pencere",
          type: "card",
          title: "Raporlanabilir operasyon",
          body: "Servis planları, araç atamaları ve rapor süreçleri TransitOS yaklaşımıyla görünür kalır.",
          imageUrl: ""
        }
      ]
    }
  ],
  tickerItems: [
    "USD/TL: Yönetici panelinden güncellenir",
    "EUR/TL: Yönetici panelinden güncellenir",
    "Motorin: Yönetici panelinden güncellenir",
    "Benzin: Yönetici panelinden güncellenir"
  ]
};

function cardKey(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR");
}

function canonicalImageUrl(value: string | undefined, fallback = "") {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return fallback;
  if (siteImageAliases[trimmed]) return siteImageAliases[trimmed];
  if (trimmed.includes("images.unsplash.com")) return fallback;
  return trimmed;
}

function canonicalCards(cards: SiteCard[], fallbacksByTitle: Record<string, string>) {
  return cards.map((card) => ({
    ...card,
    imageUrl: canonicalImageUrl(card.imageUrl, fallbacksByTitle[cardKey(card.title)] ?? "")
  }));
}

function canonicalCustomPages(pages: CustomPage[]) {
  return pages.map((page) => ({
    ...page,
    heroImageUrl: canonicalImageUrl(page.heroImageUrl, defaultSiteContent.homeHeroImageUrl),
    blocks: page.blocks.map((block) => ({
      ...block,
      imageUrl: canonicalImageUrl(block.imageUrl)
    }))
  }));
}

function canonicalSiteContent(content: SiteContent): SiteContent {
  return {
    ...content,
    gatewayImageUrl: canonicalImageUrl(content.gatewayImageUrl, defaultSiteContent.gatewayImageUrl),
    homeHeroImageUrl: canonicalImageUrl(content.homeHeroImageUrl, defaultSiteContent.homeHeroImageUrl),
    fleetHeroImageUrl: canonicalImageUrl(content.fleetHeroImageUrl, defaultSiteContent.fleetHeroImageUrl),
    vipHeroImageUrl: canonicalImageUrl(content.vipHeroImageUrl, defaultSiteContent.vipHeroImageUrl),
    mobileAppImageUrl: canonicalImageUrl(content.mobileAppImageUrl, defaultSiteContent.mobileAppImageUrl),
    fleet: canonicalCards(content.fleet, fleetImagesByTitle),
    vipFleet: canonicalCards(content.vipFleet, vipImagesByTitle),
    services: canonicalCards(content.services, serviceImagesByTitle),
    references: canonicalCards(content.references, referenceImagesByTitle),
    customPages: canonicalCustomPages(content.customPages)
  };
}

export function cardsToText(cards: SiteCard[]) {
  return cards.map((card) => [
    card.title,
    card.subtitle,
    card.body,
    card.imageUrl,
    card.meta ?? ""
  ].join(" | ")).join("\n");
}

export function customPagesToText(pages: CustomPage[]) {
  return JSON.stringify(pages, null, 2);
}

function sanitizeSiteContent(value: Partial<SiteContent>): SiteContent {
  return canonicalSiteContent({
    ...defaultSiteContent,
    ...value,
    companyName: value.companyName || defaultSiteContent.companyName,
    brandLine: value.brandLine || defaultSiteContent.brandLine,
    heroTitle: value.heroTitle || defaultSiteContent.heroTitle,
    heroSubtitle: value.heroSubtitle || defaultSiteContent.heroSubtitle,
    gatewayImageUrl: value.gatewayImageUrl || defaultSiteContent.gatewayImageUrl,
    homeHeroImageUrl: value.homeHeroImageUrl || defaultSiteContent.homeHeroImageUrl,
    fleetHeroImageUrl: value.fleetHeroImageUrl || defaultSiteContent.fleetHeroImageUrl,
    vipHeroImageUrl: value.vipHeroImageUrl || defaultSiteContent.vipHeroImageUrl,
    companySummary: value.companySummary || defaultSiteContent.companySummary,
    contactPhone: value.contactPhone || defaultSiteContent.contactPhone,
    contactEmail: value.contactEmail || defaultSiteContent.contactEmail,
    whatsappNumber: value.whatsappNumber || value.contactPhone || defaultSiteContent.whatsappNumber,
    address: value.address || defaultSiteContent.address,
    taxOffice: value.taxOffice || defaultSiteContent.taxOffice,
    taxNumber: value.taxNumber || defaultSiteContent.taxNumber,
    companyDetails: Array.isArray(value.companyDetails)
      ? value.companyDetails.map((detail, index) => ({
        id: detail.id || `kunye-${index + 1}`,
        label: detail.label || "Yeni Bilgi",
        value: detail.value || "",
        action: detail.action === "phone" || detail.action === "email" || detail.action === "map" ? detail.action : "none"
      }))
      : defaultSiteContent.companyDetails,
    fleet: Array.isArray(value.fleet) ? value.fleet : defaultSiteContent.fleet,
    vipFleet: Array.isArray(value.vipFleet) ? value.vipFleet : defaultSiteContent.vipFleet,
    services: Array.isArray(value.services) ? value.services : defaultSiteContent.services,
    privileges: Array.isArray(value.privileges) ? value.privileges : defaultSiteContent.privileges,
    references: Array.isArray(value.references) ? value.references : defaultSiteContent.references,
    transitosTitle: value.transitosTitle || defaultSiteContent.transitosTitle,
    transitosBody: value.transitosBody || defaultSiteContent.transitosBody,
    mobileAppTitle: value.mobileAppTitle || defaultSiteContent.mobileAppTitle,
    mobileAppBody: value.mobileAppBody || defaultSiteContent.mobileAppBody,
    mobileAppImageUrl: value.mobileAppImageUrl || defaultSiteContent.mobileAppImageUrl,
    customPages: Array.isArray(value.customPages) ? value.customPages : defaultSiteContent.customPages,
    tickerItems: Array.isArray(value.tickerItems) ? value.tickerItems : defaultSiteContent.tickerItems
  });
}

async function ensureContentDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

async function readDatabaseContent(): Promise<SiteContent | null> {
  if (!shouldUseContentDatabase()) return null;
  try {
    const record = await prisma.siteContentStore.findUnique({
      where: { key: siteContentKey }
    });
    return record ? sanitizeSiteContent(record.data as Partial<SiteContent>) : null;
  } catch {
    return null;
  }
}

async function writeDatabaseContent(content: SiteContent) {
  if (!shouldUseContentDatabase()) return false;
  try {
    await prisma.siteContentStore.upsert({
      where: { key: siteContentKey },
      update: { data: content as any },
      create: { key: siteContentKey, data: content as any }
    });
    return true;
  } catch {
    return false;
  }
}

async function appendDatabaseRecord(kind: "carrier" | "service", record: Record<string, string>) {
  if (!shouldUseContentDatabase()) return false;
  try {
    await prisma.siteLead.create({
      data: {
        kind,
        data: { ...record, createdAt: new Date().toISOString() }
      }
    });
    return true;
  } catch {
    return false;
  }
}

async function readDatabaseRecords(kind: "carrier" | "service") {
  if (!shouldUseContentDatabase()) return null;
  try {
    const records = await prisma.siteLead.findMany({
      where: { kind },
      orderBy: { createdAt: "desc" }
    });
    return records.map((record) => record.data as Record<string, string>);
  } catch {
    return null;
  }
}

function shouldUseContentDatabase() {
  return Boolean(process.env.DATABASE_URL) && (
    process.env.VERCEL === "1" ||
    process.env.TRANSITOS_STORE_SITE_CONTENT_IN_DB === "true"
  );
}

export async function readSiteContent(): Promise<SiteContent> {
  const databaseContent = await readDatabaseContent();
  if (databaseContent) return databaseContent;

  try {
    const raw = await fs.readFile(contentPath, "utf8");
    return sanitizeSiteContent(JSON.parse(raw));
  } catch {
    return canonicalSiteContent(defaultSiteContent);
  }
}

export async function writeSiteContent(content: SiteContent) {
  if (await writeDatabaseContent(content)) return;

  await ensureContentDir();
  await fs.writeFile(contentPath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
}

export async function appendJsonRecord(file: "carrier" | "service", record: Record<string, string>) {
  if (await appendDatabaseRecord(file, record)) return;

  await ensureContentDir();
  const filePath = file === "carrier" ? carrierApplicationsPath : serviceRequestsPath;
  let records: Record<string, string>[] = [];
  try {
    records = JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    records = [];
  }
  records.unshift({ ...record, createdAt: new Date().toISOString() });
  await fs.writeFile(filePath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

export async function readJsonRecords(file: "carrier" | "service") {
  const databaseRecords = await readDatabaseRecords(file);
  if (databaseRecords) return databaseRecords;

  const filePath = file === "carrier" ? carrierApplicationsPath : serviceRequestsPath;
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as Record<string, string>[];
  } catch {
    return [];
  }
}
