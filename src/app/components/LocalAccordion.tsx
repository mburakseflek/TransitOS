"use client";

import { useEffect, useState, type ReactNode, type SyntheticEvent } from "react";

export function LocalAccordion({
  id,
  className,
  summaryClassName,
  defaultOpen = false,
  group,
  summary,
  children
}: {
  id?: string;
  className?: string;
  summaryClassName?: string;
  defaultOpen?: boolean;
  group?: string;
  summary: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  useEffect(() => {
    if (!group) return;

    function closeSibling(event: Event) {
      const detail = (event as CustomEvent<{ group: string; id?: string }>).detail;
      if (detail?.group === group && detail.id !== id) setOpen(false);
    }

    window.addEventListener("transitos:accordion-open", closeSibling);
    return () => window.removeEventListener("transitos:accordion-open", closeSibling);
  }, [group, id]);

  function handleToggle(event: SyntheticEvent<HTMLDetailsElement>) {
    const nextOpen = event.currentTarget.open;
    setOpen(nextOpen);
    if (nextOpen && group) {
      window.dispatchEvent(new CustomEvent("transitos:accordion-open", { detail: { group, id } }));
    }
  }

  return (
    <details id={id} className={className} open={open} onToggle={handleToggle}>
      <summary className={summaryClassName}>{summary}</summary>
      {open ? children : null}
    </details>
  );
}
