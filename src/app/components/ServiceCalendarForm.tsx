"use client";

import { useRef, type FormEvent, type ReactNode } from "react";

export function ServiceCalendarForm({
  action,
  occupiedDays,
  className,
  children
}: {
  action: (formData: FormData) => void | Promise<void>;
  occupiedDays: { date: string; vehicleId: string; vehicleName: string }[];
  className?: string;
  children: ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const submissionKeyRef = useRef<HTMLInputElement>(null);

  async function submit(formData: FormData) {
    await action(formData);
    formRef.current?.reset();
  }

  function confirmVehicleConflict(event: FormEvent<HTMLFormElement>) {
    if (submissionKeyRef.current && !submissionKeyRef.current.value) {
      submissionKeyRef.current.value = crypto.randomUUID();
    }
    const formData = new FormData(event.currentTarget);
    const selectedVehicleId = String(formData.get("vehicleId") ?? "");
    const selectedDates = new Set(formData.getAll("serviceDates").map(String));
    const conflicts = occupiedDays.filter((item) => selectedDates.has(item.date) && item.vehicleId !== selectedVehicleId);
    if (!conflicts.length) return;

    const details = Array.from(new Set(conflicts.map((item) => `${formatDate(item.date)}: ${item.vehicleName}`))).join("\n");
    const approved = window.confirm(`Seçtiğiniz günlerde başka araçlara ait servis planları var:\n\n${details}\n\nAynı günlere ikinci araç da eklensin mi?`);
    if (!approved) event.preventDefault();
  }

  return <form ref={formRef} className={className} action={submit} onSubmit={confirmVehicleConflict}>
    <input ref={submissionKeyRef} type="hidden" name="submissionKey" />
    {children}
  </form>;
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("tr-TR");
}
