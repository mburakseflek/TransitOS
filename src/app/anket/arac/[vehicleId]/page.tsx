import { notFound } from "next/navigation";
import { VehicleSurveyForm } from "@/app/anket/arac/VehicleSurveyForm";
import { prisma } from "@/lib/db";
import { serviceDirectionTitle } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function VehicleSurveyPage({
  params,
  searchParams
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams?: Promise<{ sent?: string }>;
}) {
  const { vehicleId } = await params;
  const query = await searchParams;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: {
      id: true,
      fleetNumber: true,
      plateNumber: true,
      driverName: true,
      driverPhone: true,
      assignments: {
        include: { route: { include: { project: true } } },
        orderBy: [{ serviceDate: "desc" }, { serviceTime: "asc" }],
        take: 400
      }
    }
  });

  if (!vehicle) {
    notFound();
  }

  const lineMap = new Map<string, string>();
  for (const assignment of vehicle.assignments) {
    const route = assignment.route;
    const projectTitle = route.project?.name ?? route.project?.clientCompany ?? "Tek seferlik iş";
    const lineLabel = `${projectTitle} - ${route.name} (${serviceDirectionTitle(assignment.direction)})`;
    if (!lineMap.has(route.id)) {
      lineMap.set(route.id, lineLabel);
    }
  }

  const lines = Array.from(lineMap, ([id, label]) => ({ id, label }));

  return (
    <main className="survey-page">
      <section className="survey-hero">
        <img src="/brand/seflek-logo-navy.png" alt="Şeflek Tur" />
        <span>Yolcu Memnuniyet Anketi</span>
        <h1>{vehicle.fleetNumber} servisini değerlendirin</h1>
        <p>
          Görüşünüz doğrudan operasyon raporlarına düşer. Anket tek araç ve tek gün için yalnızca bir kez alınır.
        </p>
      </section>

      <VehicleSurveyForm
        vehicleId={vehicle.id}
        vehicleName={vehicle.fleetNumber}
        plateNumber={vehicle.plateNumber}
        driverName={vehicle.driverName}
        driverPhone={vehicle.driverPhone}
        lines={lines}
        sent={query?.sent}
      />
    </main>
  );
}
