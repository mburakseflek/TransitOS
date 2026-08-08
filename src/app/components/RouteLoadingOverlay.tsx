"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function RouteLoadingOverlay() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navigationKey = `${pathname}?${searchParams.toString()}`;
  const delayTimer = useRef<number | undefined>(undefined);
  const progressTimer = useRef<number | undefined>(undefined);
  const hideTimer = useRef<number | undefined>(undefined);
  const safetyTimer = useRef<number | undefined>(undefined);

  function clearTimers() {
    window.clearTimeout(delayTimer.current);
    window.clearTimeout(hideTimer.current);
    window.clearTimeout(safetyTimer.current);
    window.clearInterval(progressTimer.current);
  }

  function beginLoading() {
    clearTimers();
    document.body.dataset.navigationPending = "false";
    setProgress(0);
    delayTimer.current = window.setTimeout(() => {
      setVisible(true);
      setProgress(8);
      progressTimer.current = window.setInterval(() => {
        setProgress((current) => Math.min(88, current + Math.max(2, (92 - current) * 0.12)));
      }, 180);
    }, 650);
    safetyTimer.current = window.setTimeout(finishLoading, 7000);
  }

  function finishLoading() {
    window.clearTimeout(delayTimer.current);
    window.clearTimeout(safetyTimer.current);
    window.clearInterval(progressTimer.current);
    document.body.dataset.navigationPending = "false";
    setProgress(100);
    hideTimer.current = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, visible ? 140 : 0);
  }

  useEffect(() => {
    finishLoading();
    return clearTimers;
  }, [navigationKey]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const link = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target || link.href.startsWith("mailto:") || link.href.startsWith("tel:")) return;
      if (link.origin !== window.location.origin) return;
      if (link.pathname === window.location.pathname && link.search === window.location.search) return;
      beginLoading();
    }

    document.addEventListener("click", handleClick);
    return () => {
      document.body.dataset.navigationPending = "false";
      clearTimers();
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div
      className={`route-loader ${visible ? "show" : ""}`}
      style={{ "--loader-progress": progress / 100 } as CSSProperties}
      aria-hidden={!visible}
    >
      <div className="route-loader-card" role="status" aria-live="polite">
        <img src="/brand/seflek-logo-navy.png" alt="" />
        <div>
          <strong>TransitOS hazırlanıyor</strong>
          <span>İşleminiz güvenle tamamlanıyor.</span>
        </div>
        <i aria-hidden="true" />
      </div>
    </div>
  );
}
