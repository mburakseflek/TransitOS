type MarketItem = {
  label: string;
  value: string;
  source: string;
};

const tcmbTodayUrl = "https://www.tcmb.gov.tr/kurlar/today.xml";
const petrolOfisiUrl = "https://www.petrolofisi.com.tr/akaryakit-fiyatlari";

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

async function fetchExchangeItems(): Promise<MarketItem[]> {
  const response = await fetch(tcmbTodayUrl, {
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

function extractFuelPrice(html: string, fuel: "benzin" | "mazot" | "LPG") {
  const normalized = html.replace(/\s+/g, " ");
  const pattern = fuel === "LPG"
    ? /İstanbul Avrupa'da bugünkü güncel LPG litre fiyatı ([\d.,]+) TL/i
    : new RegExp(`İstanbul Avrupa'da bugünkü güncel ${fuel} litre fiyatı ([\\d.,]+) TL`, "i");
  return normalized.match(pattern)?.[1];
}

async function fetchFuelItems(): Promise<MarketItem[]> {
  const response = await fetch(petrolOfisiUrl, {
    next: { revalidate: 60 * 60 },
    headers: { "User-Agent": "SeflekTur TransitOS" }
  });

  if (!response.ok) {
    throw new Error("Akaryakıt verisi alınamadı.");
  }

  const html = await response.text();
  const gasoline = extractFuelPrice(html, "benzin");
  const diesel = extractFuelPrice(html, "mazot");
  const lpg = extractFuelPrice(html, "LPG");

  return [
    gasoline ? { label: "Benzin İstanbul Avrupa", value: `₺${formatTRY(gasoline)}`, source: "Petrol Ofisi" } : null,
    diesel ? { label: "Motorin İstanbul Avrupa", value: `₺${formatTRY(diesel)}`, source: "Petrol Ofisi" } : null,
    lpg ? { label: "LPG İstanbul Avrupa", value: `₺${formatTRY(lpg)}`, source: "Petrol Ofisi" } : null
  ].filter(Boolean) as MarketItem[];
}

export async function getMarketTickerItems(fallbackItems: string[]) {
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

  if (!items.length) {
    return fallbackItems;
  }

  return items.map((item) => `${item.label}: ${item.value} (${item.source})`);
}
