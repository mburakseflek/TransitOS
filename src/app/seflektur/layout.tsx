import type { ReactNode } from "react";
import { createCorporateMetadata, createOrganizationJsonLd, websiteJsonLd } from "@/app/seflektur/seo";
import { readSiteContent } from "@/lib/site-content";
import { SiteVisitTracker } from "@/app/seflektur/SiteVisitTracker";
import { WelcomeIntro } from "@/app/seflektur/WelcomeIntro";
import { appearanceCss } from "@/lib/site-appearance";
import { VisualEdits } from "./VisualEdits";

export const metadata = createCorporateMetadata({
  path: "/seflektur"
});

export default async function SeflekTurLayout({ children }: { children: ReactNode }) {
  const content = await readSiteContent();

  return (
    <>
      <style>{appearanceCss(content.appearance)}</style>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(createOrganizationJsonLd(content)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <SiteVisitTracker />
      <WelcomeIntro />
      {children}
      <VisualEdits edits={content.visualEdits} />
    </>
  );
}
