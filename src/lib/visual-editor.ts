import { safeDesignUrl, readableInk } from "./design-blocks";

export type VisualKind = "text" | "button" | "image" | "card" | "section";
export type VisualEdit = {
  source?: string; text?: string; href?: string; imageUrl?: string; alt?: string;
  color?: string; background?: string; fontSize?: number; fontWeight?: number;
  font?: "system" | "serif"; align?: "left" | "center" | "right";
  radius?: number; padding?: number; fit?: "cover" | "contain";
  animation?: "none" | "fade" | "rise" | "gradient";
};
export type VisualEdits = Record<string, Record<string, VisualEdit>>;
const pathPattern = /^(?:(?:details|summary|main|section|article|div|header|footer|nav|a|button|h[1-6]|p|span|strong|small|img|figure|figcaption|ul|li|dl|dt|dd):nth-of-type\([1-9]\d{0,3}\))(?:>(?:details|summary|main|section|article|div|header|footer|nav|a|button|h[1-6]|p|span|strong|small|img|figure|figcaption|ul|li|dl|dt|dd):nth-of-type\([1-9]\d{0,3}\)){0,18}$/;
export function normalizeVisualEdits(value: unknown): VisualEdits {
  const result: VisualEdits = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  for (const [page, entries] of Object.entries(value).slice(0,56)) {
    if (!/^(tr|eng|de|es|it|fr|zh):(home|services|fleet|vip|privileges|standards|references|contact)$/.test(page) || !entries || typeof entries !== "object" || Array.isArray(entries)) continue;
    result[page] = {};
    for (const [path, raw] of Object.entries(entries).slice(0,250)) {
      if (!pathPattern.test(path) || !raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const v = raw as Record<string,unknown>, edit: VisualEdit = {};
      for (const key of ["source","text","alt"] as const) if (typeof v[key] === "string") edit[key] = v[key].slice(0,key === "alt" ? 500 : 10000);
      if (typeof v.href === "string") edit.href = safeDesignUrl(v.href);
      if (typeof v.imageUrl === "string") edit.imageUrl = safeDesignUrl(v.imageUrl,true);
      for (const key of ["color","background"] as const) if (typeof v[key] === "string" && /^#[0-9a-f]{6}$/i.test(v[key])) edit[key] = v[key];
      for (const [key,min,max] of [["fontSize",14,100],["fontWeight",400,800],["radius",0,48],["padding",0,80]] as const) if (typeof v[key] === "number" && Number.isFinite(v[key])) edit[key]=Math.min(max,Math.max(min,v[key]));
      if (v.font === "system" || v.font === "serif") edit.font=v.font;
      if (v.align === "left" || v.align === "center" || v.align === "right") edit.align=v.align;
      if (v.fit === "cover" || v.fit === "contain") edit.fit=v.fit;
      if (["none","fade","rise","gradient"].includes(String(v.animation))) edit.animation=v.animation as VisualEdit["animation"];
      result[page][path]=edit;
    }
  }
  return result;
}

export function visualPath(element: Element, root: Element): string | null {
  const parts: string[]=[];
  for (let current: Element | null=element; current && current !== root; current=current.parentElement) {
    const tag=current.tagName.toLowerCase();
    const siblings=current.parentElement ? Array.from(current.parentElement.children).filter(sibling=>sibling.tagName===current!.tagName) : [];
    parts.unshift(`${tag}:nth-of-type(${siblings.indexOf(current)+1})`);
    if(current.parentElement===root) { const path=parts.join(">"); return pathPattern.test(path)?path:null; }
  }
  return null;
}
export function visualKind(element: Element): VisualKind {
  if(element.tagName === "IMG")return "image";
  if(element.matches("article,.corp-v2-service-card,.studio-public-block"))return "card";
  if(element.matches("a,button"))return "button";
  if(element.matches("section"))return "section";
  return "text";
}
export function editableText(element: Element): string {
  return (element.textContent || "").replace(/\s+/g," ").trim();
}
// Preserve icons, nested spans and React-owned element structure. Never accept HTML.
export function replaceVisualText(element: Element, text: string) {
  const walker=element.ownerDocument.createTreeWalker(element,4);
  const nodes: Text[]=[];
  for(let node=walker.nextNode();node;node=walker.nextNode()) {
    if(node.parentElement?.closest("svg,script,style"))continue;
    nodes.push(node as Text);
  }
  if(nodes.length){nodes[0].textContent=text;for(const node of nodes.slice(1))node.textContent="";}
  else element.appendChild(element.ownerDocument.createTextNode(text));
}
export function applyVisualEdit(element: HTMLElement, edit: VisualEdit) {
  if(!element.hasAttribute("data-visual-source"))element.setAttribute("data-visual-source",editableText(element));
  if(edit.source !== undefined && edit.source !== element.getAttribute("data-visual-source"))return;
  if(edit.text !== undefined && !element.matches("img,article,section") && !element.isContentEditable)replaceVisualText(element,edit.text);
  if(element.matches("a") && edit.href !== undefined)element.setAttribute("href",safeDesignUrl(edit.href));
  if(element.matches("img")){
    if(edit.imageUrl){element.setAttribute("src",safeDesignUrl(edit.imageUrl,true));element.removeAttribute("srcset");}
    if(edit.alt !== undefined)element.setAttribute("alt",edit.alt);
  }
  const styles: Record<string,string|undefined>={color:edit.color, "-webkit-text-fill-color":edit.color, background:edit.background,"font-size":edit.fontSize===undefined?undefined:`${edit.fontSize}px`,"font-weight":edit.fontWeight?.toString(),"text-align":edit.align,"border-radius":edit.radius===undefined?undefined:`${edit.radius}px`,padding:edit.padding===undefined?undefined:`${edit.padding}px`,"object-fit":edit.fit,"font-family":edit.font===undefined?undefined:edit.font==="serif"?"Georgia,serif":"system-ui,sans-serif"};
  if(edit.color && edit.background){styles.color=readableInk(edit.background,edit.color);styles["-webkit-text-fill-color"]=styles.color;}
  if(edit.background){
    const view=element.ownerDocument.defaultView;
    const toHex=(value:string)=>{const rgb=value.match(/\d+/g);return rgb&&rgb.length>=3?`#${rgb.slice(0,3).map(n=>Math.min(255,Number(n)).toString(16).padStart(2,"0")).join("")}`:"#14212d";};
    styles.color=readableInk(edit.background,edit.color||toHex(view?.getComputedStyle(element).color||""));styles["-webkit-text-fill-color"]=styles.color;
    for(const child of element.querySelectorAll<HTMLElement>("h1,h2,h3,h4,p,span,strong,small,a")){
      const ink=readableInk(edit.background,toHex(view?.getComputedStyle(child).color||""));
      child.style.setProperty("color",ink,"important");child.style.setProperty("-webkit-text-fill-color",ink,"important");
    }
  }
  for(const [key,value] of Object.entries(styles))if(value!==undefined)element.style.setProperty(key,value,"important");
  if(edit.animation){element.classList.remove("studio-motion-none","studio-motion-fade","studio-motion-rise","studio-motion-gradient");element.classList.add(`studio-motion-${edit.animation}`);}
}
export function applyVisualEdits(root: HTMLElement, edits: Record<string,VisualEdit>) {
  for(const element of root.querySelectorAll("h1,h2,h3,h4,p,dt,dd,summary,figcaption,span,strong,small,img,a,button,article,section"))if(!element.hasAttribute("data-visual-source"))element.setAttribute("data-visual-source",editableText(element));
  // Capture signatures before parent/child edits change any source strings.
  const targets=Object.entries(edits).map(([path,edit])=>({element:pathPattern.test(path)?root.querySelector<HTMLElement>(`:scope>${path}`):null,edit}));
  for(const {element} of targets)if(element&&!element.hasAttribute("data-visual-source"))element.setAttribute("data-visual-source",editableText(element));
  for(const {element,edit} of targets)if(element)applyVisualEdit(element,edit);
}
