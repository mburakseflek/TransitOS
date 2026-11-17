export type SiteAppearance = { accent:string; font:"system"|"serif"; size:number; radius:number; spacing:number };
export function normalizeAppearance(value:unknown):SiteAppearance {
  const v=(value && typeof value==="object" ? value : {}) as Partial<SiteAppearance>;
  const bound=(x:unknown,f:number,min:number,max:number)=>typeof x==="number" && Number.isFinite(x)?Math.min(max,Math.max(min,x)):f;
  return {accent:typeof v.accent==="string" && /^#[0-9a-f]{6}$/i.test(v.accent)?v.accent:"#c91e35",font:v.font==="serif"?"serif":"system",size:bound(v.size,16,16,22),radius:bound(v.radius,14,0,28),spacing:bound(v.spacing,24,16,48)};
}
export function appearanceCss(value:unknown) {
  const a=normalizeAppearance(value);
  const font=a.font==="serif"?"Georgia,serif":"-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif";
  return `.new-site-page.corp-v2{font-family:${font}!important;font-size:${a.size}px!important}.new-site-page.corp-v2 .corp-v2-section-label{color:${a.accent}!important}.new-site-page.corp-v2 .corp-v2-service-card{border-radius:${a.radius}px!important;padding:${a.spacing}px!important}.new-site-page.corp-v2 .corp-v2-intro-copy>p{font-size:${a.size}px!important}`;
}
