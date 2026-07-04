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

export const defaultSiteContent: SiteContent = {
  companyName: "Şeflek Tur",
  brandLine: "Turizm & Yolcu Taşımacılığı",
  heroTitle: "Şeflek Tur Turizm & Yolcu Taşımacılığı",
  heroSubtitle:
    "Kurumsal personel taşımacılığı, okul servisleri, VIP transfer, turizm ve günlük yolculuk hizmetlerinde güvenli, izlenebilir ve profesyonel operasyon.",
  gatewayImageUrl: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=2200&q=86",
  homeHeroImageUrl: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=2200&q=86",
  fleetHeroImageUrl: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=2200&q=86",
  vipHeroImageUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=2200&q=86",
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
      imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1400&q=86",
      meta: "Servis / Minibüs"
    },
    {
      title: "Mercedes-Benz Travego & Tourismo",
      subtitle: "Uzun yol ve turizm otobüsleri",
      body: "Gezi turları, şehirler arası organizasyonlar ve kalabalık gruplar için yüksek konforlu otobüs planlaması.",
      imageUrl: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1400&q=86",
      meta: "Turizm / Otobüs"
    },
    {
      title: "Renault Master / Fiat Ducato",
      subtitle: "Esnek servis kapasitesi",
      body: "Farklı personel sayıları ve güzergah yoğunlukları için ekonomik, çevik ve düzenli servis seçenekleri.",
      imageUrl: "https://images.unsplash.com/photo-1601981875583-a9b0701f0778?auto=format&fit=crop&w=1400&q=86",
      meta: "Servis / Minibüs"
    },
    {
      title: "Volkswagen Crafter Volt / Ford Transit",
      subtitle: "Kurumsal filo destek araçları",
      body: "Personel taşımacılığı, vardiya operasyonları ve günlük genel yolculuk hizmetlerinde yüksek kullanılabilirlik.",
      imageUrl: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1400&q=86",
      meta: "Kurumsal Servis"
    }
  ],
  vipFleet: [
    {
      title: "Mercedes-Benz Vito",
      subtitle: "VIP transfer ve özel yolculuk",
      body: "Misafir karşılama, yönetici transferleri ve özel organizasyonlar için sessiz, konforlu ve prestijli ulaşım.",
      imageUrl: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1400&q=86",
      meta: "VIP"
    },
    {
      title: "Volkswagen Transporter",
      subtitle: "Konforlu grup transferi",
      body: "Havalimanı, otel, toplantı ve günlük özel ulaşım talepleri için planlanabilir VIP araç alternatifi.",
      imageUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1400&q=86",
      meta: "VIP"
    },
    {
      title: "Mercedes-Benz E200",
      subtitle: "Yönetici sınıfı sedan",
      body: "Tekil VIP transferlerde kurumsal temsil gücü yüksek, konfor odaklı sedan ulaşım hizmeti.",
      imageUrl: "https://images.unsplash.com/photo-1616788494672-ec7ca25fdda9?auto=format&fit=crop&w=1400&q=86",
      meta: "Executive"
    }
  ],
  services: [
    {
      title: "Öğrenci ve Okul Taşımacılığı",
      subtitle: "Güvenli servis planlaması",
      body: "Okul saatleri, veli beklentileri ve güzergah güvenliği dikkate alınarak düzenlenen öğrenci taşıma hizmetleri.",
      imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1400&q=86",
      meta: "Okul"
    },
    {
      title: "Personel Taşımacılığı",
      subtitle: "Vardiya ve güzergah yönetimi",
      body: "Sabah, akşam, gece ve mesai servisleri için kurumsal güzergah planlama ve araç atama süreçleri.",
      imageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=86",
      meta: "Kurumsal"
    },
    {
      title: "Turizm ve Gezi Turları",
      subtitle: "Planlı grup ulaşımı",
      body: "Şehir içi ve şehir dışı gezi, tur, etkinlik ve organizasyon taşımacılığı.",
      imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=86",
      meta: "Turizm"
    },
    {
      title: "Günlük Genel Yolculuk Hizmetleri",
      subtitle: "Tek seferlik veya dönemsel ulaşım",
      body: "Firma, kurum veya şahısların günlük ulaşım ihtiyaçlarına özel planlanan esnek servis çözümleri.",
      imageUrl: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1400&q=86",
      meta: "Günlük"
    },
    {
      title: "VIP Yolculuk",
      subtitle: "Özel transfer deneyimi",
      body: "Yönetici, misafir ve özel davet transferlerinde prestijli araçlarla kontrollü ulaşım.",
      imageUrl: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1400&q=86",
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
  mobileAppImageUrl: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1600&q=86",
  customPages: [
    {
      id: "kurumsal-yolculuk",
      title: "Kurumsal Yolculuk Planlama",
      slug: "kurumsal-yolculuk",
      summary: "Şirketinizin servis ve transfer ihtiyaçları için özel planlama yaklaşımı.",
      heroImageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=86",
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
  return {
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
  };
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
    return defaultSiteContent;
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
