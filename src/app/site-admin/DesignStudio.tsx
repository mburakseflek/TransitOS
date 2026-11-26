"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { MousePointer2, Type, ImagePlus, Square, PanelTop, Save, X, ArrowUpLeft } from "lucide-react";
import { appearanceCss, normalizeAppearance } from "@/lib/site-appearance";
import { editorLanguages } from "@/lib/site-translations";
import { designPages, normalizeDesignBlocks, readableInk, type DesignBlock } from "@/lib/design-blocks";
import { applyVisualEdit, applyVisualEdits, editableText, visualKind, visualPath, type VisualEdit, type VisualKind } from "@/lib/visual-editor";
import type { SiteContent } from "@/lib/site-content";

type Selection = { path:string; kind:VisualKind; label:string; source:string; color:string; background:string; size:number };
const labels:Record<VisualKind,string>={text:"Metin",button:"Buton / bağlantı",image:"Görsel",card:"Kart",section:"Bölüm"};
const turkishPaths:Record<string,string>={home:"",services:"/hizmetler",fleet:"/filo",vip:"/vip",privileges:"/ayricaliklar",standards:"/standartlar",references:"/referanslar",contact:"/iletisim"};
const candidates="h1,h2,h3,h4,p,dt,dd,summary,figcaption,span,strong,small,img,a,button,article,section";
const emptyEdits:Record<string,VisualEdit>={};

export function DesignStudio({content,onChange,onClose}:{content:SiteContent;onChange:(next:SiteContent)=>void;onClose:()=>void}) {
  const [language,setLanguage]=useState<"tr"|keyof typeof editorLanguages>("tr");
  const [page,setPage]=useState("home"),[device,setDevice]=useState("desktop");
  const [selection,setSelection]=useState<Selection|null>(null);
  const [doc,setDoc]=useState<Document|null>(null);
  const [error,setError]=useState(""),[uploading,setUploading]=useState(false);
  const frame=useRef<HTMLIFrameElement>(null);
  const pendingBlock=useRef<string|null>(null);
  const latest=useRef({content,onChange});
  useEffect(()=>{latest.current={content,onChange};},[content,onChange]);
  const pageKey=`${language}:${page}`;
  const edits=content.visualEdits?.[pageKey]||emptyEdits;
  const edit=selection?edits[selection.path]||{}:{};
  const appearance=normalizeAppearance(content.appearance);
  const root=useCallback(()=>doc?.querySelector<HTMLElement>("main.new-site-page.corp-v2")||null,[doc]);

  const patch=useCallback((path:string,part:VisualEdit)=>{
    const current=latest.current.content;
    latest.current.onChange({...current,visualEdits:{...current.visualEdits,[pageKey]:{...current.visualEdits?.[pageKey],[path]:{...current.visualEdits?.[pageKey]?.[path],...part}}}});
  },[pageKey]);
  const selectElement=useCallback((element:HTMLElement)=>{
    const canvas=root();if(!canvas)return;
    const path=visualPath(element,canvas);if(!path)return;
    canvas.querySelectorAll("[data-studio-selected]").forEach(node=>node.removeAttribute("data-studio-selected"));
    element.setAttribute("data-studio-selected","");
    const computed=doc!.defaultView!.getComputedStyle(element);
    if(!element.hasAttribute("data-visual-source"))element.setAttribute("data-visual-source",editableText(element));
    const color=(css:string,fallback:string)=>{const rgb=css.match(/\d+/g);return rgb&&rgb.length>=3?`#${rgb.slice(0,3).map(n=>Number(n).toString(16).padStart(2,"0")).join("")}`:fallback;};
    setSelection({path,kind:visualKind(element),label:element.matches("img")?element.getAttribute("alt")||"Görsel":editableText(element),source:element.getAttribute("data-visual-source")||"",color:color(computed.color,"#14212d"),background:color(computed.backgroundColor,"#ffffff"),size:parseFloat(computed.fontSize)||16});
  },[doc,root]);

  // Draft blocks use the same safe structure as published blocks. No innerHTML.
  useEffect(()=>{
    const canvas=root();if(!canvas||!doc)return;
    canvas.querySelectorAll(".studio-public-blocks").forEach(node=>node.remove());
    const area=doc.createElement("section");area.className="studio-public-blocks";
    for(const block of normalizeDesignBlocks(content.designBlocks)[page]||[]){
      const article=doc.createElement("article");article.dataset.blockId=block.id;article.className=`studio-public-block studio-motion-${block.animation}`;
      article.style.background=block.gradient?`linear-gradient(120deg,${block.background},color-mix(in srgb,${block.background} 90%,black))`:block.background;
      article.style.color=readableInk(block.background,block.foreground);article.style.borderRadius=`${block.radius}px`;
      if(block.type==="image"&&block.imageUrl){const image=doc.createElement("img");image.src=block.imageUrl;image.alt=block.title;article.append(image);}
      if(block.type!=="button")for(const [tag,text]of [["h2",block.title],["p",block.body]]){const el=doc.createElement(tag);el.textContent=text;article.append(el);}
      if(block.href){const link=doc.createElement("a");link.href=block.href;link.className="studio-public-button";link.textContent=block.type==="button"?block.title:"İnceleyin";article.append(link);}
      area.append(article);
    }
    const footer=canvas.querySelector(".corp-v2-footer");if(footer)footer.before(area);else canvas.append(area);
    const added=Array.from(area.querySelectorAll<HTMLElement>("[data-block-id]")).find(element=>element.dataset.blockId===pendingBlock.current);
    if(added){pendingBlock.current=null;const id=requestAnimationFrame(()=>{selectElement(added);added.scrollIntoView({block:"center",behavior:"instant"});});return()=>cancelAnimationFrame(id);}
  },[content.designBlocks,page,root,doc,selectElement]);

  useEffect(()=>{
    const canvas=root();if(!doc||!canvas)return;
    let style=doc.getElementById("studio-preview");if(!style){style=doc.createElement("style");style.id="studio-preview";doc.head.append(style);}
    style.textContent=appearanceCss(content.appearance)+`[data-studio-selected]{outline:2px solid #2563eb!important;outline-offset:4px!important} ${candidates.split(",").map(tag=>`.corp-v2 ${tag}:hover`).join(",")}{cursor:pointer} [contenteditable]{cursor:text!important;outline:2px solid #2563eb!important;min-height:1em} .welcome-intro,.site-welcome-intro{display:none!important}`;
    applyVisualEdits(canvas,edits);
    canvas.querySelectorAll<HTMLElement>(candidates).forEach(element=>{if(!element.matches("a,button"))element.tabIndex=0;});
  },[content.appearance,edits,doc,root]);

  useEffect(()=>{
    const canvas=root();if(!doc||!canvas)return;
    function target(event:Event){const el=event.target as Element|null;if(!el?.closest)return null;const nearest=el.closest<HTMLElement>(candidates),control=el.closest<HTMLElement>("a,button");return control&&nearest?.matches("span,strong,small")&&!control.matches(".corp-v2-service-card")?control:nearest;}
    function click(event:Event){const element=target(event);if(element?.isContentEditable){event.stopPropagation();return;}event.preventDefault();event.stopPropagation();if(element&&root()?.contains(element))selectElement(element);else setError(`Öğe seçilemedi: ${element?.tagName||"alan"}`);}
    function startText(event:Event){const element=target(event);if(!element||!["text","button"].includes(visualKind(element)))return;event.preventDefault();selectElement(element);element.setAttribute("contenteditable","plaintext-only");element.focus();const range=doc!.createRange();range.selectNodeContents(element);const selected=doc!.getSelection();selected?.removeAllRanges();selected?.addRange(range);}
    function input(event:Event){const element=event.target as HTMLElement,current=root();if(!current||!element.isContentEditable||(event as InputEvent).isComposing)return;const path=visualPath(element,current);if(path)patch(path,{source:element.getAttribute("data-visual-source")||"",text:element.innerText});}
    function blur(event:Event){const element=event.target as HTMLElement;if(!element.isContentEditable)return;input(event);element.removeAttribute("contenteditable");}
    function key(event:KeyboardEvent){if(event.key==="Escape"){const element=event.target as HTMLElement;if(element.isContentEditable){element.blur();event.stopPropagation();}}if(event.key==="Enter"&&!(event.target as HTMLElement).isContentEditable){event.preventDefault();startText(event);}}
    doc.addEventListener("click",click,true);doc.addEventListener("dblclick",startText,true);doc.addEventListener("input",input);doc.addEventListener("compositionend",input);doc.addEventListener("blur",blur,true);doc.addEventListener("keydown",key);
    return()=>{doc.removeEventListener("click",click,true);doc.removeEventListener("dblclick",startText,true);doc.removeEventListener("input",input);doc.removeEventListener("compositionend",input);doc.removeEventListener("blur",blur,true);doc.removeEventListener("keydown",key);};
  },[doc,patch,root,selectElement]);

  const change=(part:VisualEdit)=>{if(!selection)return;patch(selection.path,{source:selection.source,...part});const element=root()?.querySelector<HTMLElement>(`:scope>${selection.path}`);if(element)applyVisualEdit(element,part);};
  function editText(){if(!selection||!doc)return;const element=root()?.querySelector<HTMLElement>(`:scope>${selection.path}`);if(!element)return;element.setAttribute("contenteditable","plaintext-only");element.focus();const range=doc.createRange();range.selectNodeContents(element);doc.getSelection()?.removeAllRanges();doc.getSelection()?.addRange(range);}
  function add(type:DesignBlock["type"]){const blocks=content.designBlocks?.[page]||[];if(blocks.length>=40)return;const id=crypto.randomUUID();pendingBlock.current=id;onChange({...content,designBlocks:{...content.designBlocks,[page]:[...blocks,{id,type,title:type==="button"?"İletişime geçin":"Yeni içerik",body:"Açıklama metni",href:type==="button"?"/seflektur/iletisim":"",imageUrl:type==="image"?content.homeHeroImageUrl:"",background:"#ffffff",foreground:"#14212d",radius:16,gradient:false,animation:"none"}]}});setSelection(null);}
  async function upload(file:File){if(!selection)return;const path=selection.path,source=selection.source;setUploading(true);setError("");try{const form=new FormData();form.set("file",file);const response=await fetch("/api/site/upload",{method:"POST",body:form});const result=await response.json();if(!response.ok||!result.url)throw new Error(result.error||"Görsel yüklenemedi.");patch(path,{source,imageUrl:result.url});}catch(error){setError(error instanceof Error?error.message:"Yükleme başarısız. Tekrar deneyin.");}finally{setUploading(false);}}
  function reset(){if(!selection)return;const next={...edits};delete next[selection.path];onChange({...content,visualEdits:{...content.visualEdits,[pageKey]:next}});setSelection(null);frame.current?.contentWindow?.location.reload();}
  function parent(){const el=selection?root()?.querySelector<HTMLElement>(`:scope>${selection.path}`):null;const ancestor=el?.parentElement?.closest<HTMLElement>("article,section,.corp-v2-service-card");if(ancestor)selectElement(ancestor);}
  useEffect(()=>{if(!selection)root()?.querySelectorAll("[data-studio-selected]").forEach(element=>element.removeAttribute("data-studio-selected"));},[selection,root]);
  const isText=selection?.kind==="text"||selection?.kind==="button";
  return <section className="studio-shell visual-studio" aria-label="Görsel tasarım stüdyosu">
    <header className="studio-top"><strong>Görsel düzenleyici</strong><label>Sayfa<select aria-label="Düzenlenen sayfa" value={page} onChange={e=>{setSelection(null);setPage(e.target.value);}}>{Object.entries(designPages).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><label>Dil<select aria-label="Düzenleme dili" value={language} onChange={e=>{setSelection(null);setLanguage(e.target.value as typeof language);}}><option value="tr">Türkçe</option>{Object.entries(editorLanguages).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><button type="submit"><Save size={16}/>Kaydet ve yayınla</button><button type="button" onClick={onClose}><X size={16}/>Kapat</button></header>
    <div className="visual-studio-workspace"><nav className="visual-studio-tools" aria-label="Ekleme araçları"><button type="button" title="Öğe seç" onClick={()=>setSelection(null)}><MousePointer2 size={20}/><span>Seç</span></button><button type="button" onClick={()=>add("text")}><Type size={20}/><span>Metin ekle</span></button><button type="button" onClick={()=>add("image")}><ImagePlus size={20}/><span>Görsel ekle</span></button><button type="button" onClick={()=>add("card")}><Square size={20}/><span>Kart ekle</span></button><button type="button" onClick={()=>add("button")}><PanelTop size={20}/><span>Buton ekle</span></button></nav>
    <div className="studio-preview"><div className="studio-preview-bar"><span>Öğeye tıklayın · Metni değiştirmek için çift tıklayın</span><select aria-label="Önizleme ekranı" value={device} onChange={e=>setDevice(e.target.value)}><option value="desktop">Masaüstü</option><option value="tablet">Tablet</option><option value="mobile">Mobil</option></select></div><iframe ref={frame} title="Seçerek düzenlenebilir sayfa" src={language==="tr"?`/seflektur${turkishPaths[page]}`:`/${language}${page==="home"?"":`/${page}`}`} onLoad={()=>{try{const next=frame.current?.contentDocument;if(next){if(next.documentElement.dataset.visualReady==="1")setDoc(next);else next.addEventListener("seflek:visual-ready",()=>setDoc(next),{once:true});}}catch{setError("Önizleme açılamadı. Sayfayı yeniden seçin.");}}} style={{width:device==="mobile"?390:device==="tablet"?768:"100%",maxWidth:"100%"}}/></div>
    <aside className="studio-properties contextual-properties" aria-label="Seçili öğenin araçları"><header><strong>{selection?labels[selection.kind]:"Sayfa düzeni"}</strong>{selection?<button type="button" onClick={()=>setSelection(null)}>Seçimi kaldır</button>:null}</header>
      {!selection?<><p>Önizlemedeki bir metin, buton, görsel, kart veya bölümü seçin. Yalnızca seçtiğiniz öğeye ait araçlar burada görünür.</p><label>İçerik genişliği · {appearance.width}px<input type="range" min="960" max="1600" step="20" value={appearance.width} onChange={e=>onChange({...content,appearance:{...appearance,width:Number(e.target.value)}})}/></label><label>Bölüm aralığı · {appearance.sectionSpacing}px<input type="range" min="32" max="144" step="4" value={appearance.sectionSpacing} onChange={e=>onChange({...content,appearance:{...appearance,sectionSpacing:Number(e.target.value)}})}/></label></>:<>
      <p className="selected-element-label">{selection.label||"Boş öğe"}</p><button type="button" onClick={parent}><ArrowUpLeft size={16}/>Üst kartı / bölümü seç</button>
      {isText?<><button type="button" onClick={editText}>Sayfanın üzerinde yaz</button><label>Metin<textarea aria-label="Seçili metin" rows={3} value={edit.text??selection.label} onChange={e=>change({text:e.target.value})}/></label><label>Yazı boyutu<input type="range" min="14" max="100" value={edit.fontSize??selection.size} onChange={e=>change({fontSize:Number(e.target.value)})}/><output>{Math.round(edit.fontSize??selection.size)}px</output></label><label>Yazı tipi<select value={edit.font??"system"} onChange={e=>change({font:e.target.value as VisualEdit["font"]})}><option value="system">Modern</option><option value="serif">Klasik</option></select></label><label>Kalınlık<select value={edit.fontWeight??400} onChange={e=>change({fontWeight:Number(e.target.value)})}><option value="400">Normal</option><option value="600">Yarı kalın</option><option value="700">Kalın</option></select></label><label>Hizalama<select value={edit.align??"left"} onChange={e=>change({align:e.target.value as VisualEdit["align"]})}><option value="left">Sol</option><option value="center">Orta</option><option value="right">Sağ</option></select></label><label>Metin rengi<input type="color" value={edit.color??selection.color} onChange={e=>change({color:e.target.value})}/></label></>:null}
      {selection.kind==="button"?<label>Buton bağlantısı<input aria-label="Buton bağlantısı" value={edit.href??root()?.querySelector(`:scope>${selection.path}`)?.getAttribute("href")??""} onChange={e=>change({href:e.target.value})}/></label>:null}
      {selection.kind==="image"?<><label>Görseli değiştir<input aria-label="Görseli değiştir" type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value="";}}/></label><label>Görsel adresi<input value={edit.imageUrl??root()?.querySelector(`:scope>${selection.path}`)?.getAttribute("src")??""} onChange={e=>change({imageUrl:e.target.value})}/></label><label>Görsel açıklaması<input value={edit.alt??selection.label} onChange={e=>change({alt:e.target.value})}/></label><label>Yerleşim<select value={edit.fit??"cover"} onChange={e=>change({fit:e.target.value as VisualEdit["fit"]})}><option value="cover">Alanı doldur</option><option value="contain">Tamamını göster</option></select></label></>:null}
      {selection.kind!=="text"&&selection.kind!=="image"?<><label>Zemin rengi<input type="color" value={edit.background??selection.background} onChange={e=>change({background:e.target.value})}/></label><label>İç boşluk<input type="range" min="0" max="80" value={edit.padding??24} onChange={e=>change({padding:Number(e.target.value)})}/></label></>:null}
      {selection.kind!=="text"?<label>Köşe yuvarlaklığı<input type="range" min="0" max="48" value={edit.radius??16} onChange={e=>change({radius:Number(e.target.value)})}/></label>:null}
      <label>Animasyon<select value={edit.animation??"none"} onChange={e=>change({animation:e.target.value as VisualEdit["animation"]})}><option value="none">Kapalı</option><option value="fade">Yumuşak belirme</option><option value="rise">Yükselerek giriş</option>{selection.kind==="card"||selection.kind==="section"?<option value="gradient">Arka plan hareketi</option>:null}</select></label>
      <button type="button" onClick={reset}>Bu öğenin değişikliklerini sıfırla</button></>}
      {error?<p role="alert">{error}</p>:null}<p role="status">Değişiklikler taslakta tutulur. Kaydet ve yayınla ile siteye uygulanır.</p>
    </aside></div>
  </section>;
}
