"use client";

import { useRef, useState, type ReactNode } from "react";
import { notifyOperationFinish } from "@/app/components/GlobalOperationOverlay";

export function ActionForm({
  action,
  className,
  children,
  dirtyGuard = false
}: {
  action: (formData: FormData) => void | Promise<void>;
  className?: string;
  children: ReactNode;
  dirtyGuard?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setErrorMessage(null);
    try {
      await action(formData);
      formRef.current?.dispatchEvent(new CustomEvent("transitos:form-success", { bubbles: true }));
    } catch {
      const form = formRef.current;
      if (form) {
        form.dataset.submitting = "false";
        form.removeAttribute("aria-busy");
        form.dispatchEvent(new CustomEvent("transitos:form-error", { bubbles: true }));
      }
      notifyOperationFinish();
      setErrorMessage("İşlem tamamlanamadı. Bilgileriniz korundu; bağlantıyı kontrol edip yeniden deneyin.");
    }
  }

  return (
    <form ref={formRef} className={className} action={submit} data-dirty-guard={dirtyGuard ? "true" : undefined}>
      {children}
      {errorMessage ? <p className="form-action-error" role="alert">{errorMessage}</p> : null}
    </form>
  );
}
