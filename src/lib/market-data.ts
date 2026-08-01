type MarketItem = {
  label: string;
  value: string;
  source: string;
};

const tcmbTodayUrl = "https://www.tcmb.gov.tr/kurlar/today.xml";
const petrolOfisiUrl = "https://www.petrolofisi.com.tr/akaryakit-fiyatlari";
const marketFetchTimeoutMs = 5000;
const marketCacheMs = 10 * 60 * 1000;

let tickerCache: { items: string[]; expiresAt: number } | null = null;
let pendingTickerRequest: Promise<string[]> | null = null;

type NextFetchInit = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

function shouldSkipLiveFetchDuringBuild() {
  return process.env.npm_lifecycle_event === "build" && process.env.TRANSITOS_FETCH_MARKET_DURING_BUILD !== "1";
}

function formatTRY(value: string) {
  const number = Number(value.replace(",", "."));
  return Number.isFinite(number)
    ? number.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : value;
}

function getXmlValue(xml: string, code: string, tag: string) {
  const block = xml.match(new RegExp(`<Currency[^>]+(?:Kod|CurrencyCode)="${code}"[\\s\\S]*?</Currency>`))?.[0];
  return block?.match(new RegExp(`<${tag}>(.*?)</${tag}>`))?.[1]?.trim();
}

async function fetchWithTimeout(url: string, init: NextFetchInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), marketFetchTimeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchExchangeItems(): Promise<MarketItem[]> {
  const response = await fetchWithTimeout(tcmbTodayUrl, {
    next: { revalidate: 60 * 60 },
    headers: { "User-Agent": "SeflekTur TransitOS" }
  });

  if (!response.ok) {
    throw new Error("TCMB kur verisi alınamadı.");
  }

  const xml = await response.text();
  const usd = getXmlValue(xml, "USD", "ForexSelling") || getXmlValue(xml, "USD", "BanknoteSelling");
  const eur = getXmlValue(xml, "EUR", "ForexSelling") || getXmlValue(xml, "EUR", "BanknoteSelling");

  return [
    usd ? { label: "USD/TL", value: formatTRY(usd), source: "TCMB" } : null,
    eur ? { label: "EUR/TL", value: formatTRY(eur), source: "TCMB" } : null
  ].filter(Boolean) as MarketItem[];
}

function extractLegacyFuelPrice(html: string, fuel: "benzin" | "mazot" | "LPG") {
  const normalized = html.replace(/\s+/g, " ");
  const pattern = fuel === "LPG"
    ? /İstanbul Avrupa'da bugünkü güncel LPG litre fiyatı ([\d.,]+) TL/i
    : new RegExp(`İstanbul Avrupa'da bugünkü güncel ${fuel} litre fiyatı ([\\d.,]+) TL`, "i");
  return normalized.match(pattern)?.[1];
}

function extractIstanbulEuropeFuelPrices(html: string) {
  const normalized = html
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ");
  const row = normalized.match(/ISTANBUL\s*\(AVRUPA\)([\s\S]{0,500})/i)?.[1] ?? "";
  const prices = Array.from(row.matchAll(/(\d{1,3}[.,]\d{2})/g), (match) => match[1]);

  return {
    gasoline: prices[0] ?? extractLegacyFuelPrice(html, "benzin"),
    diesel: prices[2] ?? extractLegacyFuelPrice(html, "mazot"),
    lpg: prices[10] ?? extractLegacyFuelPrice(html, "LPG")
  };
}

async function fetchFuelItems(): Promise<MarketItem[]> {
  const response = await fetchWithTimeout(petrolOfisiUrl, {
    next: { revalidate: 60 * 60 },
    headers: { "User-Agent": "SeflekTur TransitOS" }
  });

  if (!response.ok) {
    throw new Error("Akaryakıt verisi alınamadı.");
  }

  const html = await response.text();
  const { gasoline, diesel, lpg } = extractIstanbulEuropeFuelPrices(html);

  return [
    gasoline ? { label: "Benzin İstanbul Avrupa", value: `₺${formatTRY(gasoline)}`, source: "Petrol Ofisi" } : null,
    diesel ? { label: "Motorin İstanbul Avrupa", value: `₺${formatTRY(diesel)}`, source: "Petrol Ofisi" } : null,
    lpg ? { label: "LPG İstanbul Avrupa", value: `₺${formatTRY(lpg)}`, source: "Petrol Ofisi" } : null
  ].filter(Boolean) as MarketItem[];
}

async function loadMarketTickerItems(fallbackItems: string[]) {
  if (shouldSkipLiveFetchDuringBuild()) {
    return fallbackItems;
  }

  const [exchangeResult, fuelResult] = await Promise.allSettled([
    fetchExchangeItems(),
    fetchFuelItems()
  ]);

  const items = [
    ...(exchangeResult.status === "fulfilled" ? exchangeResult.value : []),
    ...(fuelResult.status === "fulfilled" ? fuelResult.value : [])
  ];

  const liveItems = items.map((item) => `${item.label}: ${item.value} (${item.source})`);
  if (!liveItems.length) return fallbackItems;

  const liveLabels = new Set(items.map((item) => item.label.split(" ")[0].toLocaleLowerCase("tr-TR")));
  const missingFallbacks = fallbackItems.filter((item) => {
    const label = item.split(":")[0].split(" ")[0].toLocaleLowerCase("tr-TR");
    return !liveLabels.has(label);
  });
  return [...liveItems, ...missingFallbacks];
}

export async function getMarketTickerItems(fallbackItems: string[]) {
  const now = Date.now();
  if (tickerCache && tickerCache.expiresAt > now) {
    return tickerCache.items;
  }

  if (pendingTickerRequest) {
    return pendingTickerRequest.catch(() => tickerCache?.items ?? fallbackItems);
  }

  pendingTickerRequest = loadMarketTickerItems(fallbackItems);
  try {
    const items = await pendingTickerRequest;
    tickerCache = { items, expiresAt: now + marketCacheMs };
    return items;
  } catch {
    return tickerCache?.items ?? fallbackItems;
  } finally {
    pendingTickerRequest = null;
  }
}
