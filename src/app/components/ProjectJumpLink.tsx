"use client";

import type { ReactNode } from "react";

export function ProjectJumpLink({
  targetId,
  className,
  children
}: {
  targetId: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const target = document.getElementById(targetId) as HTMLDetailsElement | null;
        if (target?.tagName === "DETAILS") {
          target.open = true;
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          window.history.replaceState(null, "", `#${targetId}`);
        }
      }}
    >
      {children}
    </button>
  );
}
