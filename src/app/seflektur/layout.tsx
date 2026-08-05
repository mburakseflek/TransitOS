import type { ReactNode } from "react";
import { corporateFaqJsonLd, createCorporateMetadata, organizationJsonLd } from "@/app/seflektur/seo";
import { TransitOSFloatingEntry } from "@/app/seflektur/SiteChrome";

export const metadata = createCorporateMetadata({
  path: "/seflektur"
});

export default function SeflekTurLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(corporateFaqJsonLd) }}
      />
      <TransitOSFloatingEntry />
      {children}
    </>
  );
}
