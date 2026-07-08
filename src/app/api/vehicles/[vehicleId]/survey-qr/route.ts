import type { NextRequest } from "next/server";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  const { vehicleId } = await params;
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const targetUrl = new URL(`/anket/arac/${encodeURIComponent(vehicleId)}`, origin).toString();
  const shouldDownload = request.nextUrl.searchParams.get("download") === "1";

  const png = await QRCode.toBuffer(targetUrl, {
    type: "png",
    width: 900,
    margin: 3,
    errorCorrectionLevel: "M",
    color: {
      dark: "#111827",
      light: "#ffffff"
    }
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `${shouldDownload ? "attachment" : "inline"}; filename="transitos-arac-anket-${vehicleId}.png"`,
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
