"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { notifyOperationFinish } from "@/app/components/GlobalOperationOverlay";

export function SubmitButton({ children = "Kaydet" }: { children?: React.ReactNode }) {
  const { pending } = useFormStatus();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    const form = buttonRef.current?.form;
    if (pending) {
      wasPending.current = true;
      return;
    }
    if (!wasPending.current) return;

    wasPending.current = false;
    if (form) {
      form.dataset.submitting = "false";
      form.removeAttribute("aria-busy");
    }
    notifyOperationFinish();
  }, [pending]);

  useEffect(() => () => {
    if (wasPending.current) notifyOperationFinish();
  }, []);

  return (
    <button ref={buttonRef} className="primary compact submit-button" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? <><span className="submit-button-spinner" aria-hidden="true" /> İşlem yapılıyor…</> : children}
    </button>
  );
}
