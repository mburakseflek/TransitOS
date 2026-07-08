"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { confirmDirtyFormExit } from "@/app/components/InteractionGuards";

const focusableSelector = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

export function ModalAction({
  label,
  title,
  children,
  tone = "default",
  buttonClassName,
  ariaLabel
}: {
  label: React.ReactNode;
  title: string;
  children: React.ReactNode;
  tone?: "default" | "danger";
  buttonClassName?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setSubmitting(false);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => {
      const firstField = dialogRef.current?.querySelector<HTMLElement>(
        "input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])"
      );
      firstField?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, submitting]);

  function close() {
    if (submitting) return;
    if (dialogRef.current && !confirmDirtyFormExit(dialogRef.current)) return;
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  const modal = open ? (
    <div className="modal-backdrop" role="presentation" onPointerDown={(event) => {
      if (event.target === event.currentTarget) close();
    }}>
      <div
        ref={dialogRef}
        className="modal-window magic-bento-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={submitting}
        onSubmit={(event) => {
          if (submitting) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          setSubmitting(true);
        }}
      >
        <div className="record-head modal-head">
          <h2 id={titleId}>{title}</h2>
          <button className="ghost icon-button" type="button" aria-label="Pencereyi kapat" onClick={close} disabled={submitting}>
            <X size={19} />
          </button>
        </div>
        <div className="section modal-body">{children}</div>
        {submitting ? (
          <div className="modal-operation-lock" role="status" aria-live="polite">
            <div className="operation-road compact" aria-hidden="true">
              <img src="/brand/transitos-service-vehicle.png" alt="" />
            </div>
            <strong>Kaydediliyor</strong>
            <span>Lütfen işlem tamamlanana kadar bekleyin.</span>
          </div>
        ) : null}
      </div>
    </div>
  ) : null;

  return (
    <div className="modal-action">
      <button
        ref={triggerRef}
        className={buttonClassName ?? (tone === "danger" ? "danger" : "ghost")}
        type="button"
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      {mounted && modal ? createPortal(modal, document.body) : null}
    </div>
  );
}
