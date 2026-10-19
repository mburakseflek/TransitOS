"use client";

import { useEffect } from "react";

export function SiteVisitTracker() {
  useEffect(() => {
    if (navigator.doNotTrack === "1") return;

    const controller = new AbortController();
    void fetch("/api/site/visit", {
      method: "POST",
      credentials: "same-origin",
      keepalive: true,
      signal: controller.signal
    }).catch(() => undefined);

    return () => controller.abort();
  }, []);

  return null;
}
