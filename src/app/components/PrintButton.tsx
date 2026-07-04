"use client";

export function PrintButton({ label = "PDF / Yazdır" }: { label?: string }) {
  return (
    <button className="ghost" type="button" onClick={() => window.print()}>
      {label}
    </button>
  );
}
