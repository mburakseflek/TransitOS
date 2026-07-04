"use client";

import { useRouter } from "next/navigation";

export function RoutePicker({
  routes,
  selectedRouteId,
  periodQuery
}: {
  routes: { id: string; name: string; subtitle: string }[];
  selectedRouteId?: string;
  periodQuery?: string;
}) {
  const router = useRouter();

  return (
    <select
      aria-label="Rota seçimi"
      className="route-picker"
      value={selectedRouteId ?? ""}
      onChange={(event) => router.push(`/transitos/routes?route=${event.target.value}${periodQuery ? `&${periodQuery}` : ""}`)}
    >
      {routes.map((route) => (
        <option key={route.id} value={route.id}>
          {route.name} · {route.subtitle}
        </option>
      ))}
    </select>
  );
}
