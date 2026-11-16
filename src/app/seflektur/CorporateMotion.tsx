"use client";

import { useEffect } from "react";

export function CorporateMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const page = document.querySelector<HTMLElement>(".new-site-page");
    if (!page) return;

    const items = page.querySelectorAll<HTMLElement>(":scope > section:not(.editorial-hero), .detail-card, .page-card, .new-fleet-card");
    page.classList.add("motion-ready");
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.revealed = "true";
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return null;
}
