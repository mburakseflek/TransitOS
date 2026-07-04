"use client";

import { useEffect } from "react";

const editableSelector = [
  "input:not([type='hidden']):not([type='button']):not([type='submit']):not([type='reset'])",
  "textarea",
  "select",
  "[contenteditable='true']"
].join(",");

const dirtyFormSelector = "form[data-dirty='true']:not([data-submitting='true'])";
const destructiveWords = [
  "sil",
  "kaldır",
  "iptal",
  "temizle",
  "sıfırla",
  "delete",
  "remove",
  "cancel",
  "reset"
];

function editableElement(target: EventTarget | null) {
  return target instanceof HTMLElement ? target.closest<HTMLElement>(editableSelector) : null;
}

function ownerForm(target: EventTarget | null) {
  const editable = editableElement(target);
  if (!editable) return null;
  if (editable instanceof HTMLInputElement || editable instanceof HTMLTextAreaElement || editable instanceof HTMLSelectElement) {
    return editable.form;
  }
  return editable.closest("form");
}

function hasDirtyForms(root: ParentNode = document) {
  return Boolean(root.querySelector(dirtyFormSelector));
}

function isDestructiveSubmitter(submitter: HTMLElement | null, form: HTMLFormElement) {
  const label = `${submitter?.textContent ?? ""} ${submitter?.getAttribute("aria-label") ?? ""} ${form.textContent ?? ""}`.toLocaleLowerCase("tr-TR");
  return (
    submitter?.classList.contains("danger") ||
    submitter?.hasAttribute("data-confirm-danger") ||
    form.hasAttribute("data-confirm-danger") ||
    destructiveWords.some((word) => label.includes(word))
  );
}

function canLeaveDirtyForm() {
  return window.confirm("Kaydedilmemiş değişiklikler var. Çıkarsanız bu değişiklikler kaybolacak. Devam edilsin mi?");
}

function canRunDestructiveAction() {
  return window.confirm("Bu işlem geri alınamayabilir. Devam etmek istediğinize emin misiniz?");
}

export function confirmDirtyFormExit(root: ParentNode = document) {
  return !hasDirtyForms(root) || canLeaveDirtyForm();
}

export function InteractionGuards() {
  useEffect(() => {
    function markDirty(event: Event) {
      const form = ownerForm(event.target);
      if (!form || form.dataset.ignoreDirtyGuard === "true") return;
      form.dataset.dirty = "true";
      form.dataset.submitting = "false";
    }

    function handleSubmit(event: Event) {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      if (!form) return;

      const submitter = (event as SubmitEvent).submitter as HTMLElement | null;
      if (isDestructiveSubmitter(submitter, form) && !canRunDestructiveAction()) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      form.dataset.submitting = "true";
      form.dataset.dirty = "false";
    }

    function handleDocumentClick(event: MouseEvent) {
      const link = event.target instanceof HTMLElement ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.dataset.ignoreDirtyGuard === "true") return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;
      if (!hasDirtyForms()) return;

      const href = link.getAttribute("href") ?? "";
      if (href.startsWith("#")) return;
      if (!canLeaveDirtyForm()) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasDirtyForms()) return;
      event.preventDefault();
      event.returnValue = "";
    }

    document.addEventListener("input", markDirty, true);
    document.addEventListener("change", markDirty, true);
    document.addEventListener("submit", handleSubmit, true);
    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("input", markDirty, true);
      document.removeEventListener("change", markDirty, true);
      document.removeEventListener("submit", handleSubmit, true);
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return null;
}
