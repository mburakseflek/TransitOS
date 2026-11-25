"use client";
import { Globe2, Check } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { languages } from "@/lib/languages";
import { languagePath } from "@/lib/language-path";
export function LanguagePicker({current="tr"}:{current?:string}) {
 const [open, setOpen] = useState(false);
 const root = useRef<HTMLDivElement>(null);
 const trigger = useRef<HTMLButtonElement>(null);
 const id = useId();
 useEffect(() => {
  if (!open) return;
  const closeOutside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
  const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
  document.addEventListener("pointerdown", closeOutside);
  document.addEventListener("keydown", escape);
  root.current?.querySelector<HTMLAnchorElement>("[aria-current='true']")?.focus();
  return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", escape); };
 }, [open]);
 return <div className="language-picker" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
  <button ref={trigger} className="language-trigger" type="button" aria-label="Language / Dil" title="Language / Dil" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}><Globe2 size={21} strokeWidth={1.6} aria-hidden="true" /></button>
  {open ? <nav id={id} className="language-popover" aria-label="Language / Dil">{languages.map(language => <a key={language.code} href={languagePath(language.code, typeof window === "undefined" ? "/" : window.location.pathname)} lang={language.code === "eng" ? "en" : language.code} hrefLang={language.code === "eng" ? "en" : language.code} aria-current={current === language.code ? "true" : undefined} onClick={() => { document.cookie=`site_language=${language.code}; Path=/; Max-Age=31536000; SameSite=Lax`; setOpen(false); }}><span>{language.label}</span>{current === language.code ? <Check size={16} aria-hidden="true" /> : null}</a>)}</nav> : null}
 </div>;
}
