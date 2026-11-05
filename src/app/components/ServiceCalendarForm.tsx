"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { notifyOperationFinish } from "@/app/components/GlobalOperationOverlay";

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
  const router = useRouter();
  const submissionKeyRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setErrorMessage(null);
    if (!formData.getAll("serviceDates").some((value) => String(value).trim())) {
      releaseForm();
      setErrorMessage("Takvimden en az bir servis günü seçin.");
      return;
    }
    try {
      await action(formData);
      formRef.current?.reset();
      router.refresh();
      formRef.current?.dispatchEvent(new CustomEvent("transitos:form-success", { bubbles: true }));
    } catch {
      releaseForm();
      setErrorMessage("Servis planı kaydedilemedi. Seçimleriniz korundu; bağlantıyı kontrol edip yeniden deneyin.");
    }
  }

  function releaseForm() {
    const form = formRef.current;
    if (form) {
      form.dataset.submitting = "false";
      form.removeAttribute("aria-busy");
      form.dispatchEvent(new CustomEvent("transitos:form-error", { bubbles: true }));
    }
    notifyOperationFinish();
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
    {errorMessage ? <p className="form-action-error" role="alert">{errorMessage}</p> : null}
  </form>;
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("tr-TR");
}
