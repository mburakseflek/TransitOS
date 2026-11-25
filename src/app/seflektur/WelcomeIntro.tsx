"use client";

import { useEffect, useState } from "react";
import type { CorporateLocale } from "@/lib/corporate-routes";

export function WelcomeIntro({ copy = {} }: { locale?: CorporateLocale; copy?:Record<string,string> }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (sessionStorage.getItem("seflek-welcome")) return;
      sessionStorage.setItem("seflek-welcome", "1");
    } catch { return; }
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 1100);
    return () => window.clearTimeout(timer);
  }, []);
  if (!visible) return null;
  return <div className="welcome-intro" aria-label="Şeflek Tur karşılama">
    <img src="/seflek-logo-white.png" alt="Şeflek Tur" width="236" height="92" />
    <span>{copy["Yolculuğunuz güvenle başlar."] || "Yolculuğunuz güvenle başlar."}</span>
    <button type="button" onClick={() => setVisible(false)}>{copy["Geç"] || "Geç"}</button>
  </div>;
}
