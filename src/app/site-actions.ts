"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  appendJsonRecord,
  CompanyDetail,
  CustomPage,
  defaultSiteContent,
  readSiteContent,
  SiteBlock,
  SiteCard,
  writeSiteContent
} from "@/lib/site-content";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function lines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseCards(value: string, fallback: SiteCard[]) {
  const parsed = lines(value).map((line) => {
    const [title = "", subtitle = "", body = "", imageUrl = "", meta = ""] = line.split("|").map((item) => item.trim());
    return { title, subtitle, body, imageUrl, meta };
  }).filter((card) => card.title && card.body);

  return parsed.length ? parsed : fallback;
}

function parseCustomPages(value: string, fallback: CustomPage[]) {
  try {
    const parsed = JSON.parse(value) as CustomPage[];
    if (!Array.isArray(parsed)) return fallback;
    return parsed.map((page, index): CustomPage => ({
      id: page.id || `sayfa-${index + 1}`,
      title: page.title || "Yeni Sayfa",
      slug: (page.slug || page.title || `sayfa-${index + 1}`)
        .toLowerCase()
        .replaceAll("ı", "i")
        .replaceAll("ğ", "g")
        .replaceAll("ü", "u")
        .replaceAll("ş", "s")
        .replaceAll("ö", "o")
        .replaceAll("ç", "c")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
      summary: page.summary || "",
      heroImageUrl: page.heroImageUrl || "",
      blocks: Array.isArray(page.blocks) ? page.blocks.map((block, blockIndex): SiteBlock => {
        const type: SiteBlock["type"] = block.type === "image" || block.type === "card" ? block.type : "text";
        return {
          id: block.id || `blok-${blockIndex + 1}`,
          type,
          title: block.title || "Yeni Blok",
          body: block.body || "",
          imageUrl: block.imageUrl || ""
        };
      }) : []
    }));
  } catch {
    return fallback;
  }
}

function parseCompanyDetails(value: string, fallback: CompanyDetail[]) {
  try {
    const parsed = JSON.parse(value) as CompanyDetail[];
    if (!Array.isArray(parsed)) return fallback;
    return parsed.map((detail, index): CompanyDetail => ({
      id: detail.id || `kunye-${index + 1}`,
      label: String(detail.label || "Yeni Bilgi").trim(),
      value: String(detail.value || "").trim(),
      action: detail.action === "phone" || detail.action === "email" || detail.action === "map" ? detail.action : "none"
    })).filter((detail) => detail.label && detail.value);
  } catch {
    return fallback;
  }
}

export async function saveSiteContent(formData: FormData) {
  const existing = await readSiteContent();
  await writeSiteContent({
    ...existing,
    companyName: text(formData, "companyName") || defaultSiteContent.companyName,
    brandLine: text(formData, "brandLine") || defaultSiteContent.brandLine,
    heroTitle: text(formData, "heroTitle") || defaultSiteContent.heroTitle,
    heroSubtitle: text(formData, "heroSubtitle") || defaultSiteContent.heroSubtitle,
    gatewayImageUrl: text(formData, "gatewayImageUrl") || defaultSiteContent.gatewayImageUrl,
    homeHeroImageUrl: text(formData, "homeHeroImageUrl") || defaultSiteContent.homeHeroImageUrl,
    fleetHeroImageUrl: text(formData, "fleetHeroImageUrl") || defaultSiteContent.fleetHeroImageUrl,
    vipHeroImageUrl: text(formData, "vipHeroImageUrl") || defaultSiteContent.vipHeroImageUrl,
    companySummary: text(formData, "companySummary") || defaultSiteContent.companySummary,
    contactPhone: text(formData, "contactPhone") || defaultSiteContent.contactPhone,
    contactEmail: text(formData, "contactEmail") || defaultSiteContent.contactEmail,
    whatsappNumber: text(formData, "whatsappNumber") || text(formData, "contactPhone") || defaultSiteContent.whatsappNumber,
    address: text(formData, "address") || defaultSiteContent.address,
    taxOffice: text(formData, "taxOffice") || defaultSiteContent.taxOffice,
    taxNumber: text(formData, "taxNumber") || defaultSiteContent.taxNumber,
    companyDetails: parseCompanyDetails(text(formData, "companyDetails"), defaultSiteContent.companyDetails),
    transitosTitle: text(formData, "transitosTitle") || defaultSiteContent.transitosTitle,
    transitosBody: text(formData, "transitosBody") || defaultSiteContent.transitosBody,
    mobileAppTitle: text(formData, "mobileAppTitle") || defaultSiteContent.mobileAppTitle,
    mobileAppBody: text(formData, "mobileAppBody") || defaultSiteContent.mobileAppBody,
    mobileAppImageUrl: text(formData, "mobileAppImageUrl") || defaultSiteContent.mobileAppImageUrl,
    tickerItems: lines(text(formData, "tickerItems")).length ? lines(text(formData, "tickerItems")) : defaultSiteContent.tickerItems,
    fleet: parseCards(text(formData, "fleet"), defaultSiteContent.fleet),
    vipFleet: parseCards(text(formData, "vipFleet"), defaultSiteContent.vipFleet),
    services: parseCards(text(formData, "services"), defaultSiteContent.services),
    privileges: parseCards(text(formData, "privileges"), defaultSiteContent.privileges),
    references: parseCards(text(formData, "references"), defaultSiteContent.references),
    customPages: parseCustomPages(text(formData, "customPages"), defaultSiteContent.customPages)
  });

  revalidatePath("/");
  revalidatePath("/seflektur");
  revalidatePath("/seflektur/hizmetler");
  revalidatePath("/seflektur/filo");
  revalidatePath("/seflektur/vip");
  revalidatePath("/seflektur/ayricaliklar");
  revalidatePath("/seflektur/referanslar");
  revalidatePath("/seflektur/iletisim");
  revalidatePath("/seflektur/sayfa/[slug]", "page");
  revalidatePath("/seflektur/transitos");
  revalidatePath("/site-admin");
  redirect("/site-admin?saved=1");
}

export async function submitCarrierApplication(formData: FormData) {
  await appendJsonRecord("carrier", {
    companyName: text(formData, "companyName"),
    authorizedPerson: text(formData, "authorizedPerson"),
    phone: text(formData, "phone"),
    email: text(formData, "email"),
    city: text(formData, "city"),
    vehicleCount: text(formData, "vehicleCount"),
    vehicleTypes: text(formData, "vehicleTypes"),
    note: text(formData, "note")
  });
  redirect("/seflektur/tasimacilar?sent=1");
}

export async function submitServiceRequest(formData: FormData) {
  await appendJsonRecord("service", {
    companyName: text(formData, "companyName"),
    contactPerson: text(formData, "contactPerson"),
    phone: text(formData, "phone"),
    email: text(formData, "email"),
    serviceType: text(formData, "serviceType"),
    routeInfo: text(formData, "routeInfo"),
    passengerCount: text(formData, "passengerCount"),
    note: text(formData, "note")
  });
  redirect("/seflektur/teklif?sent=1");
}
