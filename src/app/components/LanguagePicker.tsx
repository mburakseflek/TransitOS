"use client";
import { Globe2, Check, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { languages } from "@/lib/languages";
import { languagePath } from "@/lib/language-path";
import { CorporateDialog } from "@/app/components/CorporateDialog";
export function LanguagePicker({current="tr"}:{current?:string}) {
 const [open,setOpen]=useState(false);
 const trigger=useRef<HTMLButtonElement>(null);
 const id=useId();
 const pathname=usePathname();
 const segment=pathname.split("/")[1];
 const selected=languages.some(language=>language.code===segment)?segment:current;
 const close=()=>{setOpen(false);trigger.current?.focus();};
 return <div className="language-picker">
  <button ref={trigger} className="language-trigger" type="button" aria-label="Language / Dil" title="Language / Dil" aria-expanded={open} aria-controls={id} aria-haspopup="dialog" onClick={()=>setOpen(true)}><Globe2 size={22} strokeWidth={1.6} aria-hidden="true" /></button>
  <CorporateDialog open={open} onClose={close} label="Language / Dil" id={id} className="corporate-language-dialog">
   <div className="corporate-dialog-heading"><strong>Language / Dil</strong><button type="button" onClick={close} aria-label="Close / Kapat"><X size={22} aria-hidden="true" /></button></div>
   <nav aria-label="Language / Dil">{languages.map(language=><a key={language.code} href={languagePath(language.code,pathname)} lang={language.code==="eng"?"en":language.code} hrefLang={language.code==="eng"?"en":language.code} aria-current={selected===language.code?"true":undefined} onClick={event=>{
    if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();
    document.cookie="site_language="+language.code+"; Path=/; Max-Age=31536000; SameSite=Lax";
    window.location.assign(languagePath(language.code,pathname));
   }}><span>{language.label}</span>{selected===language.code?<Check size={18} aria-hidden="true"/>:null}</a>)}</nav>
  </CorporateDialog>
 </div>;
}
