import type { MetadataRoute } from "next";
import { readSiteContent } from "@/lib/site-content";

const siteUrl = "https://www.seflektur.com";

const staticCorporateRoutes = [
  "/",
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
  const now = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "/" || route === "/seflektur" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route === "/seflektur" ? 0.95 : 0.7
  }));
}

