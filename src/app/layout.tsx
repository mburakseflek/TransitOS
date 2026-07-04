import type { Metadata, Viewport } from "next";
import { InteractionEffects } from "@/app/components/InteractionEffects";
import { RouteLoadingOverlay } from "@/app/components/RouteLoadingOverlay";
import "./globals.css";

export const metadata: Metadata = {
  title: "Şeflek Tur Turizm & Yolcu Taşımacılığı",
  description: "Şeflek Tur kurumsal tanıtım sitesi ve TransitOS operasyon platformu",
  manifest: "/manifest.webmanifest",
  applicationName: "SeflekTur TransitOS",
  appleWebApp: {
    capable: true,
    title: "SeflekTur TransitOS",
    statusBarStyle: "black-translucent"
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/app-icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  }
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
