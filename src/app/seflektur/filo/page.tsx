import FleetView from "@/app/seflektur/views/FleetView";
import { createCorporateMetadata } from "@/app/seflektur/seo";

export const metadata = createCorporateMetadata({
  title: "Şeflek Tur Filo | İstanbul Servis ve Turizm Araçları",
  description:
    "Şeflek Tur filosunda Mercedes-Benz Sprinter, Travego, Tourismo, Renault Master, Fiat Ducato, Volkswagen Crafter Volt ve Ford Transit araç tipleriyle servis ve turizm taşımacılığı planlanır.",
  path: "/seflektur/filo"
});

export default function Page() { return <FleetView />; }
