import HomeView from "@/app/seflektur/views/HomeView";
import { createCorporateMetadata } from "@/app/seflektur/seo";

export const metadata = createCorporateMetadata({
  path: "/seflektur"
});

export default function Page() { return <HomeView />; }
