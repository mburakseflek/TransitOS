"use client";
import Link from "next/link";
import type { Route } from "next";
import { Menu, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { LanguagePicker } from "@/app/components/LanguagePicker";
import { CorporateDialog } from "@/app/components/CorporateDialog";
import { type CorporateLocale, corporateHref } from "@/lib/corporate-routes";
type SiteNavLink={href:Route;label:string;className?:string};
export function CorporateMobileNav({links,locale="tr",copy={}}:{links:readonly SiteNavLink[];locale?:CorporateLocale;copy?:Record<string,string>}) {
 const t=(value:string)=>copy[value]||value;
 const [open,setOpen]=useState(false);
 const trigger=useRef<HTMLButtonElement>(null);
 const id=useId();
 const close=()=>{setOpen(false);trigger.current?.focus();};
 return <>
  <div className="corporate-mobile-header-space" aria-hidden="true" />
  <header className="corporate-mobile-header" aria-label="Şeflek Tur">
   <Link className="corporate-mobile-brand" href={corporateHref(locale,"/seflektur")} aria-label="Şeflek Tur"><img src="/brand/seflek-logo-navy.png" alt="Şeflek Tur" width="236" height="92"/></Link>
   <div className="corporate-mobile-actions"><LanguagePicker current={locale}/><button className="corporate-mobile-menu-trigger" ref={trigger} type="button" aria-label={t("Menüyü aç")} aria-expanded={open} aria-haspopup="dialog" aria-controls={id} onClick={()=>setOpen(true)}><Menu size={24} aria-hidden="true"/><span>{t("Menü")}</span></button></div>
  </header>
  <CorporateDialog open={open} onClose={close} label={t("Menü")} id={id} className="corporate-menu-dialog">
   <div className="corporate-dialog-heading"><strong>{t("Menü")}</strong><button type="button" aria-label={t("Menüyü kapat")} onClick={close}><X size={24} aria-hidden="true"/></button></div>
   <nav aria-label={t("Menü")}>{links.map(item=><Link key={item.href} href={item.href} className={item.className} onClick={()=>setOpen(false)}>{item.label}</Link>)}</nav>
  </CorporateDialog>
 </>;
}
