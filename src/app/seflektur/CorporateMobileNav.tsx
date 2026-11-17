"use client";

import Link from "next/link";
import type { Route } from "next";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SiteNavLink = {
  href: Route;
  label: string;
  className?: string;
};

export function CorporateMobileNav({ links }: { links: readonly SiteNavLink[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      menuButton.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <>
      <div className="site-mobile-chrome" aria-label="Şeflek Tur mobil hızlı menü">
        <Link className="site-mobile-brand" href="/seflektur" aria-label="Şeflek Tur ana sayfa" onClick={() => setIsOpen(false)}>
          <img src="/brand/seflek-logo-navy.png" alt="Şeflek Tur" width="236" height="92" />
        </Link>
        <button
          className="site-mobile-menu-button"
          ref={menuButton}
          type="button"
          aria-label={isOpen ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={isOpen}
          aria-controls="corporate-mobile-menu"
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
        tabIndex={isOpen ? 0 : -1}
        onClick={() => setIsOpen(false)}
      />
      <nav id="corporate-mobile-menu" inert={!isOpen} aria-hidden={!isOpen} className={isOpen ? "site-mobile-drawer is-open" : "site-mobile-drawer"} aria-label="Mobil kurumsal site menüsü">
        <div className="site-mobile-drawer-head">
          <img src="/brand/seflek-logo-navy.png" alt="Şeflek Tur" width="236" height="92" />
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
