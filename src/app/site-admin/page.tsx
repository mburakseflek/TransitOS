import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { canManageSite, readSessionToken } from "@/lib/auth";
import { readJsonRecords, readSiteContent } from "@/lib/site-content";
import { SiteEditorClient } from "@/app/site-admin/SiteEditorClient";
import { readVisitorAnalytics } from "@/lib/site-analytics";

export default async function SiteAdminPage({ searchParams }: { searchParams?: Promise<{ saved?: string }> }) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get("transitos_session")?.value;
  const user = token ? await readSessionToken(token).catch(() => null) : null;

  if (!canManageSite(user)) {
    redirect("/login?next=/site-admin");
  }

  const [content, carriers, requests, visitorAnalytics] = await Promise.all([
    readSiteContent(),
    readJsonRecords("carrier"),
    readJsonRecords("service"),
    readVisitorAnalytics()
  ]);

  return (
    <SiteEditorClient
      initialContent={content}
      carriers={carriers}
      requests={requests}
      saved={params?.saved === "1"}
      visitorAnalytics={visitorAnalytics}
    />
  );
}
