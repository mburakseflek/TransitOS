import type { ReactNode } from "react";
import { readSiteContent } from "@/lib/site-content";
import { appearanceCss } from "@/lib/site-appearance";
import { WelcomeIntro } from "@/app/seflektur/WelcomeIntro";
import { SiteVisitTracker } from "@/app/seflektur/SiteVisitTracker";
import { createOrganizationJsonLd, websiteJsonLd } from "@/app/seflektur/seo";
import { type CorporateLocale, controlCopy } from "@/lib/corporate-locale";
import { languages } from "@/lib/languages";
import { notFound } from "next/navigation";
import { VisualEdits } from "@/app/seflektur/VisualEdits";

export default async function LocalizedCorporateLayout({ children, params }: { children: ReactNode; params:Promise<{locale:string}> }) {
  const {locale}=await params;
  if(!languages.some(language => language.code === locale)) notFound();
  const content=await readSiteContent();
  return <>
    <style>{appearanceCss(content.appearance)}</style>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(createOrganizationJsonLd(content))}} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({...websiteJsonLd,url:`https://www.seflektur.com/${locale}`,inLanguage:locale==="eng"?"en":locale})}} />
    <SiteVisitTracker /><WelcomeIntro copy={controlCopy(locale as CorporateLocale)} />{children}
    <VisualEdits edits={content.visualEdits} />
  </>;
}
