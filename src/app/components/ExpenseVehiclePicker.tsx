"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";

type SubcontractorOption = {
  id: string;
  companyName: string;
};

type VehicleOption = {
  id: string;
  subcontractorId: string | null;
  fleetNumber: string;
  plateNumber: string;
};

export function ExpenseVehiclePicker({
  subcontractors,
  vehicles,
  defaultSubcontractorId = "",
  defaultVehicleId = ""
}: {
  subcontractors: SubcontractorOption[];
  vehicles: VehicleOption[];
  defaultSubcontractorId?: string | null;
  defaultVehicleId?: string | null;
}) {
  const firstSubcontractor = subcontractors[0]?.id ?? "";
  const [subcontractorId, setSubcontractorId] = useState(defaultSubcontractorId || firstSubcontractor);
  const filteredVehicles = useMemo(
    () => vehicles.filter((vehicle) => vehicle.subcontractorId === subcontractorId),
    [subcontractorId, vehicles]
  );
  const selectedVehicleStillValid = filteredVehicles.some((vehicle) => vehicle.id === defaultVehicleId);

  return (
    <>
      <Field label="Taşeron" hint="Gider hangi taşeronun hakedişinden düşecek?">
        <select name="subcontractorId" value={subcontractorId} onChange={(event) => setSubcontractorId(event.target.value)} required>
          {subcontractors.map((item) => <option key={item.id} value={item.id}>{item.companyName}</option>)}
        </select>
      </Field>
      <Field label="Araç" hint="Yalnızca seçilen taşerona ait araçlar listelenir.">
        <select name="vehicleId" defaultValue={selectedVehicleStillValid ? defaultVehicleId ?? "" : ""} key={subcontractorId}>
          <option value="">Genel gider</option>
          {filteredVehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.fleetNumber} · {vehicle.plateNumber}</option>)}
        </select>
      </Field>
    </>
  );
}

function Field({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <label className="field-row">
      <span>
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
      {children}
    </label>
  );
}
