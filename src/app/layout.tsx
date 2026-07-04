import type { Metadata, Viewport } from "next";
import { InteractionEffects } from "@/app/components/InteractionEffects";
import { RouteLoadingOverlay } from "@/app/components/RouteLoadingOverlay";
import "./globals.css";

export const metadata: Metadata = {
  title: "Şeflek Tur Turizm & Yolcu Taşımacılığı",
  description: "Şeflek Tur kurumsal tanıtım sitesi ve TransitOS operasyon platformu"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>
        <RouteLoadingOverlay />
        <InteractionEffects />
        {children}
      </body>
    </html>
  );
}
