"use client";

import { FileDown } from "lucide-react";

export function CorporatePagePrintButton({ label = "A4 PDF / Yazdır", className = "ghost compact-button corporate-page-print" }: { label?: string; className?: string }) {
  return <button className={className} type="button" onClick={() => window.print()}><FileDown size={16} aria-hidden="true" />{label}</button>;
}
