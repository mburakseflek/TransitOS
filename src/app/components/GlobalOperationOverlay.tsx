"use client";

import { useEffect, useState } from "react";

type OperationDetail = {
  label?: string;
};

const defaultLabel = "İşlem tamamlanıyor";

function bodyOperationLabel() {
  if (typeof document === "undefined") return defaultLabel;
  return document.body.dataset.operationLabel || defaultLabel;
}

export function notifyOperationStart(label = defaultLabel) {
  if (typeof window === "undefined") return;
  document.body.dataset.operationPending = "true";
  document.body.dataset.operationLabel = label;
  window.dispatchEvent(new CustomEvent<OperationDetail>("transitos:operation-start", { detail: { label } }));
}

export function notifyOperationFinish() {
  if (typeof window === "undefined") return;
  document.body.dataset.operationPending = "false";
  delete document.body.dataset.operationLabel;
  window.dispatchEvent(new Event("transitos:operation-finish"));
}

export function GlobalOperationOverlay() {
  const [visible, setVisible] = useState(false);
  const [label, setLabel] = useState(defaultLabel);

  useEffect(() => {
    let safetyTimer: number | undefined;

    function clearSafetyTimer() {
      if (safetyTimer) {
        window.clearTimeout(safetyTimer);
        safetyTimer = undefined;
      }
    }

    function show(nextLabel = bodyOperationLabel()) {
      clearSafetyTimer();
      setLabel(nextLabel || defaultLabel);
      setVisible(true);
      safetyTimer = window.setTimeout(() => {
        document.body.dataset.operationPending = "false";
        delete document.body.dataset.operationLabel;
        setVisible(false);
      }, 22000);
    }

    function hide() {
      clearSafetyTimer();
      if (document.body.dataset.operationPending !== "false") {
        document.body.dataset.operationPending = "false";
      }
      delete document.body.dataset.operationLabel;
      setVisible(false);
    }

    function handleStart(event: Event) {
      show((event as CustomEvent<OperationDetail>).detail?.label);
    }

    function handleFinish() {
      hide();
    }

    const observer = new MutationObserver(() => {
      if (document.body.dataset.operationPending === "true") {
        show(bodyOperationLabel());
      } else {
        hide();
      }
    });

    window.addEventListener("transitos:operation-start", handleStart);
    window.addEventListener("transitos:operation-finish", handleFinish);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-operation-pending", "data-operation-label"]
    });

    if (document.body.dataset.operationPending === "true") {
      show(bodyOperationLabel());
    }

    return () => {
      clearSafetyTimer();
      observer.disconnect();
      window.removeEventListener("transitos:operation-start", handleStart);
      window.removeEventListener("transitos:operation-finish", handleFinish);
    };
  }, []);

  return (
    <div
      className="global-operation-overlay"
      data-visible={visible ? "true" : "false"}
      aria-hidden={!visible}
    >
      <div className="global-operation-card" role="status" aria-live="polite">
        <div className="operation-road" aria-hidden="true">
          <img src="/brand/transitos-service-vehicle.png" alt="" />
        </div>
        <strong>{label}</strong>
        <span>Lütfen işlem tamamlanana kadar bekleyin.</span>
      </div>
    </div>
  );
}
