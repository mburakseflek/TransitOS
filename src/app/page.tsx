import { redirect } from "next/navigation";
import type { Route } from "next";
import { cookies, headers } from "next/headers";
import { languages } from "@/lib/languages";
import { createCorporateMetadata } from "@/app/seflektur/seo";

export const metadata = createCorporateMetadata({
  path: "/"
});

export default async function HomePage() {
  const chosen=(await cookies()).get("site_language")?.value;
  if(chosen && languages.some(l=>l.code===chosen)) redirect((chosen==="tr"?"/seflektur":"/"+chosen) as Route);
  const language=(await headers()).get("accept-language")?.split(",")[0]?.toLowerCase() ?? "tr";
  redirect((language.startsWith("tr")?"/seflektur":"/eng") as Route);
}
