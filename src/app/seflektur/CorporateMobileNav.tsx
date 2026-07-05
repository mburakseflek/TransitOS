"use client";

import Link from "next/link";
import type { Route } from "next";
import { Menu, X } from "lucide-react";
import { useState } from "react";

type SiteNavLink = {
  href: Route;
  label: string;
  className?: string;
};

export function CorporateMobileNav({ links }: { links: readonly SiteNavLink[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="site-mobile-chrome" aria-label="Şeflek Tur mobil hızlı menü">
        <Link className="site-mobile-brand" href="/seflektur" aria-label="Şeflek Tur ana sayfa" onClick={() => setIsOpen(false)}>
          <img src="/brand/seflek-logo-navy.png" alt="Şeflek Tur" />
        </Link>
        <button
          className="site-mobile-menu-button"
          type="button"
          aria-label={isOpen ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
        >
          <Menu size={22} />
          <span>Menü</span>
        </button>
      </div>
      <button
        className={isOpen ? "site-mobile-nav-backdrop is-open" : "site-mobile-nav-backdrop"}
        type="button"
        aria-label="Menüyü kapat"
        onClick={() => setIsOpen(false)}
      />
      <nav className={isOpen ? "site-mobile-drawer is-open" : "site-mobile-drawer"} aria-label="Mobil kurumsal site menüsü">
        <div className="site-mobile-drawer-head">
          <img src="/brand/seflek-logo-navy.png" alt="Şeflek Tur" />
          <button type="button" aria-label="Menüyü kapat" onClick={() => setIsOpen(false)}>
            <X size={18} />
            <span>Kapat</span>
          </button>
        </div>
        {links.map((item) => (
          <Link key={item.href} className={item.className} href={item.href} onClick={() => setIsOpen(false)}>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
