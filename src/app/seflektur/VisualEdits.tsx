"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { applyVisualEdits, normalizeVisualEdits, type VisualEdits as Edits } from "@/lib/visual-editor";
const sections: Record<string,string>={hizmetler:"services",filo:"fleet",vip:"vip",ayricaliklar:"privileges",standartlar:"standards",referanslar:"references",iletisim:"contact"};
export function VisualEdits({edits}:{edits?:Edits}){
  const pathname=usePathname();
  useEffect(()=>{
    const parts=pathname.split("/").filter(Boolean),language=parts[0]==="seflektur"?"tr":parts[0],page=sections[parts[1]]||parts[1]||"home";
    const root=document.querySelector<HTMLElement>("main.new-site-page.corp-v2");
    if(root)applyVisualEdits(root,normalizeVisualEdits(edits)[`${language}:${page}`]||{});
    document.documentElement.dataset.visualReady="1";
    document.dispatchEvent(new Event("seflek:visual-ready"));
  },[edits,pathname]);
  return null;
}
