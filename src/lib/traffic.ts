export type TrafficItem = {
  name: string;
  level: number;
  note: string;
};

const publicTrafficEndpoints = [
  "https://api.ibb.gov.tr/tkmservices/api/TrafficData/v1/TrafficIndex",
  "https://api.ibb.gov.tr/tkmservices/api/TrafficData/v1/TrafficDensity",
  "https://api.ibb.gov.tr/tkmservices/api/TrafficData/v1/TrafficDensityMap"
];
const trafficFetchTimeoutMs = 1800;

const monitoredRegions = [
  "Beylikdüzü",
  "Esenyurt",
  "Avcılar",
  "Küçükçekmece",
  "Büyükçekmece",
  "Mahmutbey",
  "Basın Ekspres",
  "Sefaköy-Yenibosna",
  "TEM Batı Koridoru",
  "E-5 Batı Koridoru"
] as const;

export async function getTrafficSnapshot(): Promise<{ source: string; items: TrafficItem[]; updatedAt: Date }> {
  const configuredUrls = [
    process.env.IBB_TRAFFIC_API_URL,
    process.env.YANDEX_TRAFFIC_API_URL
  ].filter(Boolean) as string[];
  const urls = [...configuredUrls, ...publicTrafficEndpoints];
  const results = await Promise.all(urls.map((liveUrl) => fetchTrafficEndpoint(liveUrl)));
  const liveResult = results.find(Boolean);

  if (liveResult) {
    return liveResult;
  }

  return {
    source: "Canlı harita katmanı aktif, sayısal yoğunluk kaynağı yanıt vermedi",
    items: [],
    updatedAt: new Date()
  };
}

async function fetchTrafficEndpoint(liveUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), trafficFetchTimeoutMs);

  try {
    const response = await fetch(liveUrl, {
      signal: controller.signal,
      next: { revalidate: 60 * 5 },
      headers: { "User-Agent": "SeflekTur TransitOS" }
    });
    if (!response.ok) return null;

    const payload = await response.json();
    const parsed = parseTrafficPayload(payload);
    if (!parsed.length) return null;

    return {
      source: liveUrl.includes("ibb") ? "İBB canlı veri" : "Yandex canlı veri",
      items: prioritizeTrafficItems(parsed),
      updatedAt: new Date()
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function getYandexMapKitApiKey() {
  return process.env.YANDEX_MAPKIT_API_KEY ?? process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY ?? "";
}

export function istanbulTrafficMapEmbedUrl() {
  return "https://yandex.com.tr/map-widget/v1/?ll=28.7768%2C41.0438&z=10&l=trf%2Ctrfe";
}

function parseTrafficPayload(payload: unknown): TrafficItem[] {
  const records = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as any)?.data)
      ? (payload as any).data
      : Array.isArray((payload as any)?.items)
        ? (payload as any).items
        : Array.isArray((payload as any)?.features)
          ? (payload as any).features
          : Array.isArray((payload as any)?.result)
            ? (payload as any).result
            : [];

  return records.flatMap((record: any) => {
    const properties = record?.properties ?? record;
    const name = String(
      properties?.name ??
      properties?.region ??
      properties?.district ??
      properties?.title ??
      properties?.roadName ??
      properties?.yolAdi ??
      properties?.ilce ??
      ""
    ).trim();
    const rawLevel = Number(
      properties?.level ??
      properties?.density ??
      properties?.trafficIndex ??
      properties?.value ??
      properties?.trafficLevel ??
      properties?.yogunluk ??
      properties?.hizYogunluk
    );
    if (!name || !Number.isFinite(rawLevel)) return [];
    return [{
      name,
      level: Math.max(0, Math.min(100, Math.round(rawLevel))),
      note: record?.note ? String(record.note) : "Canlı servis"
    }];
  });
}

function prioritizeTrafficItems(items: TrafficItem[]) {
  const priority = new Map(monitoredRegions.map((name, index) => [normalize(name), index]));
  return [...items].sort((a, b) => {
    const aPriority = priority.get(normalize(a.name)) ?? 999;
    const bPriority = priority.get(normalize(b.name)) ?? 999;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return b.level - a.level;
  }).slice(0, 14);
}

function normalize(value: string) {
  return value.toLocaleLowerCase("tr-TR").replace(/\s+/g, "");
}
