export type SiteAppearance = { accent:string; font:"system"|"serif"; size:number; radius:number; spacing:number; width:number; sectionSpacing:number; headingSize:number; lineHeight:number; buttonRadius:number; imageRadius:number };
export function normalizeAppearance(value:unknown):SiteAppearance {
  const v=(value && typeof value==="object" ? value : {}) as Partial<SiteAppearance>;
  const bound=(x:unknown,f:number,min:number,max:number)=>typeof x==="number" && Number.isFinite(x)?Math.min(max,Math.max(min,x)):f;
  return {accent:typeof v.accent==="string" && /^#[0-9a-f]{6}$/i.test(v.accent)?v.accent:"#c91e35",font:v.font==="serif"?"serif":"system",size:bound(v.size,16,16,22),radius:bound(v.radius,14,0,28),spacing:bound(v.spacing,24,16,48),width:bound(v.width,1240,960,1600),sectionSpacing:bound(v.sectionSpacing,80,32,144),headingSize:bound(v.headingSize,64,32,88),lineHeight:bound(v.lineHeight,1.6,1.3,1.9),buttonRadius:bound(v.buttonRadius,8,0,32),imageRadius:bound(v.imageRadius,16,0,40)};
}
export function appearanceCss(value:unknown) {
  const a=normalizeAppearance(value);
  const font=a.font==="serif"?"Georgia,serif":"-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif";
  const r=".new-site-page.corp-v2";
  return `${r}{--v2-container:${a.width}px;font-family:${font}!important;font-size:${a.size}px!important}${r} .corp-v2-section-label{color:${a.accent}!important}${r} .corp-v2-service-card{border-radius:${a.radius}px!important;padding:${a.spacing}px!important}${r} :is(.corp-v2-intro-copy>p,.corp-v2-service-card p){font-size:${a.size}px!important;line-height:${a.lineHeight}!important}${r} :is(.corp-v2-services,.corp-v2-intro,.corp-v2-process){padding-block:clamp(32px,6vw,${a.sectionSpacing}px)!important}${r} .corp-v2-section-head h2{font-size:clamp(32px,5vw,${a.headingSize}px)!important;overflow-wrap:break-word}${r} :is(.container,.site-container){max-width:${a.width}px!important;width:100%;min-width:0}${r} :is(.new-primary,.new-secondary){border-radius:${a.buttonRadius}px!important}${r} :is(.corp-v2-intro img,.corp-v2-service-card img){border-radius:${a.imageRadius}px!important}`;
}
