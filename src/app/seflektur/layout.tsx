import type { ReactNode } from "react";
import { createCorporateMetadata, createOrganizationJsonLd, websiteJsonLd } from "@/app/seflektur/seo";
import { readSiteContent } from "@/lib/site-content";
import { SiteVisitTracker } from "@/app/seflektur/SiteVisitTracker";

export const metadata = createCorporateMetadata({
  path: "/seflektur"
});

export default async function SeflekTurLayout({ children }: { children: ReactNode }) {
  const content = await readSiteContent();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(createOrganizationJsonLd(content)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <SiteVisitTracker />
      {children}
    </>
  );
}
