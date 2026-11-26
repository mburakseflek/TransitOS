import type { SiteContent } from "./site-content";
import { corporateTranslations, normalizedCorporateTranslations } from "./corporate-translations";
import { type CorporateLocale, corporateHref } from "./corporate-routes";
export { type CorporateLocale, corporateSections, corporateHref } from "./corporate-routes";

export function translate(locale: CorporateLocale, value: string | undefined, overrides?: Record<string,string>): string {
  if (!value || locale === "tr") return value || "";
  const key = value.replace(/\s+/g, " ").trim();
  const translated = overrides?.[key] ?? (corporateTranslations[key] || normalizedCorporateTranslations.get(key.toLocaleLowerCase("tr")))?.[locale];
  if (!translated) return value;
  return `${/^\s/.test(value) ? " " : ""}${translated}${/\s$/.test(value) ? " " : ""}`;
}

export function controlCopy(locale: CorporateLocale): Record<string,string> {
  return Object.fromEntries(["Telefon","E-posta","Adres","Vergi Dairesi","Vergi No","Muhasebe","Menü","Kapat","Menüyü aç","Menüyü kapat","Geç","Yolculuğunuz güvenle başlar.","Devam edilsin mi?"].map(key=>[key,translate(locale,key)]));
}

export function localizeCorporateJsonLd(value: unknown, locale: CorporateLocale): unknown {
  if (locale === "tr") return value;
  if (Array.isArray(value)) return value.map(item => localizeCorporateJsonLd(item, locale));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key,item]) => [key,key === "inLanguage" ? (locale === "eng" ? "en" : locale === "zh" ? "zh-Hans" : locale) : localizeCorporateJsonLd(item,locale)]));
  if (typeof value !== "string") return value;
  const origin = "https://www.seflektur.com";
  if (value.startsWith(`${origin}/seflektur`)) return origin + corporateHref(locale,value.slice(origin.length));
  return translate(locale,value);
}

// Translate display copy only. Image paths, company identities, contact details,
// addresses and operational data remain the original values; nothing is saved.
export function localizeSiteContent(content: SiteContent, locale: CorporateLocale): SiteContent {
  if (locale === "tr") return content;
  const t = (value: string | undefined) => translate(locale, value, content.translations?.[locale]);
  const cards = (items: SiteContent["fleet"]) => items.map(item => ({ ...item, title:t(item.title), subtitle:t(item.subtitle), body:t(item.body), meta:t(item.meta) }));
  return { ...content,
    heroTitle:t(content.heroTitle), heroSubtitle:t(content.heroSubtitle), companySummary:t(content.companySummary),
    transitosTitle:t(content.transitosTitle), transitosBody:t(content.transitosBody), mobileAppTitle:t(content.mobileAppTitle), mobileAppBody:t(content.mobileAppBody),
    fleet:cards(content.fleet), vipFleet:cards(content.vipFleet), services:cards(content.services), privileges:cards(content.privileges),
    references:content.references.map(item => ({ ...item, subtitle:t(item.subtitle), body:t(item.body), meta:t(item.meta) })),
    companyDetails:content.companyDetails.map(item => ({ ...item, label:t(item.label) })),
    customPages:content.customPages.map(page => ({ ...page, title:t(page.title), summary:t(page.summary) }))
  };
}
