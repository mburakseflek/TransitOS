"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MonitorCog } from "lucide-react";

export function CorporateTransitOSEntry() {
  const pathname = usePathname();
  const isCorporateSite = pathname === "/" || pathname.startsWith("/seflektur");

  if (!isCorporateSite) return null;

  return (
    <Link
      className="global-transitos-fixed-button"
      href="/login?next=/transitos/dashboard"
      aria-label="TransitOS operasyon paneline giriş yap"
    >
      <MonitorCog size={25} strokeWidth={2.3} aria-hidden="true" />
      <span>TransitOS Giriş</span>
    </Link>
  );
}
