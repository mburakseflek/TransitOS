"use client";

import { useEffect } from "react";

const recoveryKey = "transitos-runtime-recovery";
const recoverableError = /chunkloaderror|loading chunk|failed to fetch dynamically imported module|failed to load resource|networkerror|failed to find server action|server action.{0,40}(not found|missing)|failed to fetch.{0,20}(rsc|server component)|invalid server response/i;

function reloadOnce() {
  const now = Date.now();
  const lastRecovery = Number(window.sessionStorage.getItem(recoveryKey) ?? 0);
  if (now - lastRecovery < 30_000) return;
  window.sessionStorage.setItem(recoveryKey, String(now));
  window.location.reload();
}

export function RuntimeRecovery() {
  useEffect(() => {
    document.documentElement.classList.add("runtime-ready");
    let blankPageTimer: number | undefined;

    function verifyPageHealth() {
      window.clearTimeout(blankPageTimer);
      blankPageTimer = window.setTimeout(() => {
        const main = document.querySelector<HTMLElement>("main");
        const hasVisiblePage = Boolean(main && main.getBoundingClientRect().height > 40 && (main.textContent?.trim() || main.querySelector("img, form, section, nav")));
        if (!hasVisiblePage) reloadOnce();
      }, 1200);
    }

    function handleError(event: Event) {
      const failedAsset = event.target instanceof HTMLScriptElement ||
        (event.target instanceof HTMLLinkElement && event.target.rel === "stylesheet");
      const errorEvent = event instanceof ErrorEvent ? event : null;
      const message = `${errorEvent?.message ?? ""} ${errorEvent?.error instanceof Error ? errorEvent.error.message : ""}`;
      if (failedAsset || recoverableError.test(message)) reloadOnce();
    }

    function handleRejection(event: PromiseRejectionEvent) {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason ?? "");
      if (recoverableError.test(reason)) reloadOnce();
    }

    function restorePage(event: PageTransitionEvent) {
      document.body.dataset.operationPending = "false";
      document.body.dataset.navigationPending = "false";
      if (event.persisted && !document.querySelector("main")) reloadOnce();
      verifyPageHealth();
    }

    function handleOperationFinish() {
      verifyPageHealth();
    }

    const pageObserver = new MutationObserver(() => {
      if (!document.querySelector("main")) verifyPageHealth();
    });

    window.addEventListener("error", handleError, true);
    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("pageshow", restorePage);
    window.addEventListener("transitos:operation-finish", handleOperationFinish);
    pageObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.documentElement.classList.remove("runtime-ready");
      window.clearTimeout(blankPageTimer);
      pageObserver.disconnect();
      window.removeEventListener("error", handleError, true);
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("pageshow", restorePage);
      window.removeEventListener("transitos:operation-finish", handleOperationFinish);
    };
  }, []);

  return (
    <aside className="runtime-recovery-fallback" role="alert" aria-label="Sayfa kurtarma seçenekleri">
      <strong>Sayfa görüntülenemedi</strong>
      <span>Bağlantınız açık. Uygulamayı güvenli biçimde yeniden başlatabilirsiniz.</span>
      <div>
        <a href="">Sayfayı yenile</a>
        <a href="/transitos/dashboard">Ana panele dön</a>
      </div>
    </aside>
  );
}
