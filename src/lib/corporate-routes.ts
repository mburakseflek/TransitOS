import type { Route } from "next";
export type CorporateLocale = "tr" | "eng" | "de" | "es" | "it" | "fr" | "zh";
export const corporateSections = {services:"hizmetler",fleet:"filo",contact:"iletisim",vip:"vip",privileges:"ayricaliklar",standards:"standartlar",references:"referanslar"} as const;
export function corporateHref(locale: CorporateLocale, href: string): Route {
  if (locale === "tr" || !href.startsWith("/seflektur")) return href as Route;
  const split = href.search(/[?#]/);
  const pathname = split < 0 ? href : href.slice(0,split);
  const suffix = split < 0 ? "" : href.slice(split);
  const slug = pathname.slice("/seflektur".length).replace(/^\//, "");
  if (!slug) return `/${locale}${suffix}` as Route;
  const section = Object.entries(corporateSections).find(([, tr]) => tr === slug)?.[0];
  return (section ? `/${locale}/${section}${suffix}` : href) as Route;
}
