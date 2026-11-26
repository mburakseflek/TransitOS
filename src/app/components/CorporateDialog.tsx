"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Native top-layer dialogs cannot be covered by the page's legacy blur/stacking layers.
export function CorporateDialog({ open, onClose, label, id, children, className = "" }: {
  open:boolean; onClose:()=>void; label:string; id:string; children:ReactNode; className?:string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!open) { if (dialog.open) dialog.close(); return; }
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.querySelector<HTMLElement>("[aria-current='true']")?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, [open]);
  return <dialog ref={ref} id={id} className={`corporate-overlay-dialog ${className}`} aria-label={label}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}>
    {children}
  </dialog>;
}
