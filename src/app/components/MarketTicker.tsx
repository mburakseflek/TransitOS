"use client";

import { useEffect, useState } from "react";

export function MarketTicker({
  fallbackItems,
  placement = "app"
}: {
  fallbackItems: string[];
  placement?: "app" | "site";
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

  return (
    <aside className={`market-strip market-strip-${placement}`} aria-label="Döviz ve akaryakıt bilgi bandı">
      <div className="market-strip-viewport">
        <div className="market-strip-track">
          <TickerItems items={items} />
          <TickerItems items={items} hidden />
        </div>
      </div>
    </aside>
  );
}

function TickerItems({ items, hidden = false }: { items: string[]; hidden?: boolean }) {
  return (
    <div className="market-strip-group" aria-hidden={hidden || undefined}>
      {items.map((item, index) => (
        <span className="market-strip-item" key={`${item}-${index}`}>
          <i aria-hidden="true" />
          {item}
        </span>
      ))}
    </div>
  );
}
