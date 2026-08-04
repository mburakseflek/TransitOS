import { redirect } from "next/navigation";
import { createCorporateMetadata } from "@/app/seflektur/seo";

export const metadata = createCorporateMetadata({
  path: "/"
});

export default function HomePage() {
  redirect("/seflektur");
}
