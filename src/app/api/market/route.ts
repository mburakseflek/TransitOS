import { NextResponse } from "next/server";
import { getMarketTickerItems } from "@/lib/market-data";

const fallbackItems = [
  "USD/TL: güncel veri bekleniyor",
  "EUR/TL: güncel veri bekleniyor",
  "Motorin İstanbul Avrupa: güncel veri bekleniyor",
  "Benzin İstanbul Avrupa: güncel veri bekleniyor"
];

export async function GET() {
  const items = await getMarketTickerItems(fallbackItems);
  return NextResponse.json({ items }, {
    headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" }
  });
}
