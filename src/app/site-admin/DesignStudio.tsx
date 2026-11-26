"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { appearanceCss, normalizeAppearance, type SiteAppearance } from "@/lib/site-appearance";
import { editorLanguages } from "@/lib/site-translations";
import { corporateTranslations } from "@/lib/corporate-translations";
import { translate } from "@/lib/corporate-locale";
import type { SiteContent } from "@/lib/site-content";
import { BlockDesigner } from "./BlockDesigner";
import { normalizeDesignBlocks, readableInk } from "@/lib/design-blocks";

export function DesignStudio({content,onChange,onClose}:{content:SiteContent;onChange:(next:SiteContent)=>void;onClose:()=>void}) {
  const [language,setLanguage]=useState<"tr"|keyof typeof editorLanguages>("tr");
  const [tab,setTab]=useState("design");
  const [search,setSearch]=useState("");
  const [device,setDevice]=useState("desktop");
  const [previewPage,setPreviewPage]=useState("home");
  const frame=useRef<HTMLIFrameElement>(null);
  const a=normalizeAppearance(content.appearance);
  const css=appearanceCss(a);
  const previewBlocks = useCallback(() => {
    const doc=frame.current?.contentDocument;if(!doc)return;
    doc.getElementById("studio-draft-blocks")?.remove();
    doc.querySelectorAll(".studio-public-blocks").forEach(node=>node.remove());
    const area=doc.createElement("section");area.id="studio-draft-blocks";area.className="studio-public-blocks";
    for(const block of normalizeDesignBlocks(content.designBlocks)[previewPage]||[]){
      const article=doc.createElement("article");article.className=`studio-public-block studio-motion-${block.animation}`;article.style.background=block.gradient?`linear-gradient(120deg,${block.background},color-mix(in srgb,${block.background} 90%,black))`:block.background;article.style.color=readableInk(block.background,block.foreground);article.style.borderRadius=`${block.radius}px`;
      if(block.imageUrl&&block.type==="image"){const image=doc.createElement("img");image.src=block.imageUrl;image.alt=block.title;article.appendChild(image);}
      for(const [tag,text] of [["h2",block.title],["p",block.body]]){if(text){const el=doc.createElement(tag);el.textContent=text;article.appendChild(el);}}
      area.appendChild(article);
    }
    const footer=doc.querySelector(".corp-v2-footer");if(footer)footer.before(area);
  }, [content.designBlocks,previewPage]);
  function preview() {
    const doc=frame.current?.contentDocument;
    if (!doc) return;
    let style=doc.getElementById("studio-preview");
    if(!style){style=doc.createElement("style");style.id="studio-preview";doc.head.appendChild(style);}
    style.textContent=css;
    previewBlocks();
  }
  useEffect(()=>{const id=setTimeout(()=>{
    const doc=frame.current?.contentDocument;if(!doc)return;
    let style=doc.getElementById("studio-preview");if(!style){style=doc.createElement("style");style.id="studio-preview";doc.head.appendChild(style);}style.textContent=css;
  },100);return()=>clearTimeout(id);},[css]);
  useEffect(()=>{const timer=setTimeout(previewBlocks,150);return()=>clearTimeout(timer);},[previewBlocks]);
  useEffect(()=>{const close=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose();};window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close);},[onClose]);
  const patch=(key:keyof SiteAppearance,value:string|number)=>onChange({...content,appearance:normalizeAppearance({...a,[key]:value})});
  const ranges: [keyof SiteAppearance,string,number,number,number][]=[
    ["size","Gövde metni",16,22,1],["headingSize","Bölüm başlıkları",32,88,2],["lineHeight","Satır yüksekliği",1.3,1.9,.05],
    ["width","İçerik genişliği",960,1600,20],["sectionSpacing","Bölüm aralığı",32,144,4],["spacing","Kart iç boşluğu",16,48,2],
    ["radius","Kart köşeleri",0,28,1],["buttonRadius","Buton köşeleri",0,32,1],["imageRadius","Görsel köşeleri",0,40,1]
  ];
  const sources=new Set(Object.keys(corporateTranslations));
  for(const blocks of Object.values(content.designBlocks || {}))for(const block of blocks){if(block.title)sources.add(block.title);if(block.body)sources.add(block.body);}
  for(const key of ["heroTitle","heroSubtitle","companySummary","transitosTitle","transitosBody","mobileAppTitle","mobileAppBody"] as const)sources.add(content[key]);
  for(const cards of [content.services,content.fleet,content.vipFleet,content.privileges,content.references])for(const card of cards)for(const key of ["title","subtitle","body"] as const)if(card[key])sources.add(card[key]);
  return <section className="studio-shell" aria-label="Tasarım stüdyosu">
    <header className="studio-top"><div><strong>Tasarım stüdyosu</strong><small>Değişiklikler ana araç çubuğundaki Kaydet ile yayınlanır.</small></div><label>Düzenleme dili<select value={language} onChange={e=>setLanguage(e.target.value as typeof language)}><option value="tr">Türkçe · ana dil</option>{Object.entries(editorLanguages).map(([code,label])=><option key={code} value={code}>{label}</option>)}</select></label><button type="button" onClick={onClose}>Düzenleyiciye dön</button></header>
    <div className="studio-workspace"><aside className="studio-properties"><nav><button type="button" aria-pressed={tab==="blocks"} onClick={()=>setTab("blocks")}>Bloklar</button><button type="button" aria-pressed={tab==="design"} onClick={()=>setTab("design")}>Görünüm</button><button type="button" aria-pressed={tab==="text"} onClick={()=>setTab("text")}>Dil içerikleri</button></nav>{tab==="blocks"?<BlockDesigner content={content} onChange={onChange}/>:null}
      {tab==="design"?<><p>Tasarım tüm dillerde ortak uygulanır. Metin ve operasyon verileri korunur.</p><details open><summary>Tipografi ve vurgu</summary><label>Vurgu rengi<input type="color" value={a.accent} onChange={e=>patch("accent",e.target.value)}/></label><label>Yazı ailesi<select value={a.font} onChange={e=>patch("font",e.target.value)}><option value="system">Sistem · modern sans serif</option><option value="serif">Georgia · editoryal</option></select></label>{ranges.slice(0,3).map(([key,label,min,max,step])=><label key={key}>{label} <output>{a[key]}</output><input type="range" min={min} max={max} step={step} value={a[key]} onChange={e=>patch(key,Number(e.target.value))}/></label>)}</details><details open><summary>Sayfa, kart ve görsel düzeni</summary>{ranges.slice(3).map(([key,label,min,max,step])=><label key={key}>{label} <output>{a[key]}</output><input type="range" min={min} max={max} step={step} value={a[key]} onChange={e=>patch(key,Number(e.target.value))}/></label>)}</details><button type="button" onClick={()=>{if(confirm("Görünüm ayarları varsayılana döndürülsün mü?"))onChange({...content,appearance:normalizeAppearance(null)});}}>Görünümü sıfırla</button></>:tab==="text"?<><p>Türkçe içerikler ana düzenleyicide, diğer diller burada düzenlenir. Boş bırakılan çeviri mevcut metne döner.</p>{language==="tr"?<p>Üstten düzenlemek istediğiniz yabancı dili seçin.</p>:<><label>Metin ara<input type="search" value={search} onChange={e=>setSearch(e.target.value)}/></label>{[...sources].filter(source=>source.toLocaleLowerCase().includes(search.toLocaleLowerCase()) || translate(language,source,content.translations?.[language]).toLocaleLowerCase().includes(search.toLocaleLowerCase())).map(source=><label key={source}><span>{source}</span><textarea rows={3} value={content.translations?.[language]?.[source] ?? translate(language,source)} onChange={e=>onChange({...content,translations:{...content.translations,[language]:{...content.translations?.[language],[source]:e.target.value}}})}/></label>)}</>}</>:null}
    </aside><div className="studio-preview"><div className="studio-preview-bar"><select aria-label="Önizleme sayfası" value={previewPage} onChange={e=>setPreviewPage(e.target.value)}>{["home","services","fleet","vip","privileges","standards","references","contact"].map(page=><option key={page} value={page}>{page}</option>)}</select><strong>Gerçek sayfa · kaydedilmiş içerik / taslak görünüm</strong><select aria-label="Önizleme ekranı" value={device} onChange={e=>setDevice(e.target.value)}><option value="desktop">Masaüstü</option><option value="tablet">Tablet · 768</option><option value="mobile">Mobil · 390</option></select></div><iframe ref={frame} title="Kurumsal sayfa tasarım önizlemesi" src={language==="tr"?`/seflektur${({home:"",services:"/hizmetler",fleet:"/filo",vip:"/vip",privileges:"/ayricaliklar",standards:"/standartlar",references:"/referanslar",contact:"/iletisim"} as Record<string,string>)[previewPage]}`:`/${language}${previewPage==="home"?"":`/${previewPage}`}`} onLoad={preview} style={{width:device==="mobile"?390:device==="tablet"?768:"100%",maxWidth:"100%"}}/><p>Dil içeriklerindeki değişiklikler kaydedildikten sonra önizlemeye yansır.</p></div></div>
  </section>;
}
