"use client";

import { useState, type ReactNode, type SyntheticEvent } from "react";

export function LocalAccordion({
  id,
  className,
  summaryClassName,
  defaultOpen = false,
  summary,
  children
}: {
  id?: string;
  className?: string;
  summaryClassName?: string;
  defaultOpen?: boolean;
  summary: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  function handleToggle(event: SyntheticEvent<HTMLDetailsElement>) {
    setOpen(event.currentTarget.open);
  }

  return (
    <details id={id} className={className} open={open} onToggle={handleToggle}>
      <summary className={summaryClassName}>{summary}</summary>
      {open ? children : null}
    </details>
  );
}
