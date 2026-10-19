import type { MetadataRoute } from "next";
import { readSiteContent } from "@/lib/site-content";

const siteUrl = "https://www.seflektur.com";

const staticCorporateRoutes = [
  "/seflektur",
  "/seflektur/hizmetler",
  "/seflektur/filo",
  "/seflektur/vip",
  "/seflektur/ayricaliklar",
  "/seflektur/standartlar",
  "/seflektur/referanslar",
  "/seflektur/transitos",
  "/seflektur/iletisim",
  "/seflektur/tasimacilar",
  "/seflektur/teklif"
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await readSiteContent();
  const customRoutes = content.customPages
    .filter((page) => Boolean(page.slug))
    .map((page) => `/seflektur/sayfa/${page.slug}`);

  const routes = Array.from(new Set([...staticCorporateRoutes, ...customRoutes]));
  const routeImages: Record<string, string[]> = {
    "/seflektur": [`${siteUrl}/site-media/hero-home.png`],
    "/seflektur/hizmetler": [`${siteUrl}/site-media/service-personnel.png`, `${siteUrl}/site-media/service-school.png`],
    "/seflektur/filo": [`${siteUrl}/site-media/hero-fleet.png`],
    "/seflektur/vip": [`${siteUrl}/site-media/hero-vip.png`],
    "/seflektur/transitos": [`${siteUrl}/site-media/transitos-mobile.png`]
  };

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    images: routeImages[route],
    changeFrequency: route === "/" || route === "/seflektur" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route === "/seflektur" ? 0.95 : 0.7
  }));
}

