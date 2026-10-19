"use client";

import { useRef, type ReactNode } from "react";

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

  async function submit(formData: FormData) {
    await action(formData);
    formRef.current?.dispatchEvent(new CustomEvent("transitos:form-success", { bubbles: true }));
  }

  return (
    <form ref={formRef} className={className} action={submit} data-dirty-guard={dirtyGuard ? "true" : undefined}>
      {children}
    </form>
  );
}
