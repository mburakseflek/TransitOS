"use client";

import { useEffect, useState } from "react";
import { SkiperTickerRail } from "@/app/components/RegistryInterfaceKit";

export function MarketTicker({
  className,
  fallbackItems,
  withVisibilityShell = false
}: {
  className: string;
  fallbackItems: string[];
  withVisibilityShell?: boolean;
}) {
  const [items, setItems] = useState(fallbackItems);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6500);

    fetch("/api/market", { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((payload: { items?: string[] }) => {
        if (Array.isArray(payload.items) && payload.items.length) setItems(payload.items);
      })
      .catch(() => undefined)
      .finally(() => window.clearTimeout(timeout));

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const rail = <SkiperTickerRail items={items} />;
  return (
    <div className={className} aria-label="Döviz ve akaryakıt bilgi bandı">
      {withVisibilityShell ? <div className="ticker-visibility-shell">{rail}</div> : rail}
    </div>
  );
}
