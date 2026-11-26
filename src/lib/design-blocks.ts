export type DesignBlock={id:string;type:"text"|"card"|"image"|"button";title:string;body:string;imageUrl:string;href:string;background:string;foreground:string;gradient:boolean;animation:"none"|"fade"|"rise"|"gradient";textAnimation?:"none"|"fade"|"rise";radius:number};
export type PageDesignBlocks=Record<string,DesignBlock[]>;
export const designPages={home:"Ana sayfa",services:"Hizmetler",fleet:"Filo",vip:"VIP",privileges:"Ayrıcalıklar",standards:"Standartlar",references:"Referanslar",contact:"İletişim"};
export function safeDesignUrl(value:unknown,image=false){if(typeof value!=="string" || /[\\\u0000-\u001f\u007f]/.test(value))return "";if(/^\/(?!\/)/.test(value))return value;if(/^https:\/\//i.test(value))return value;if(!image&&/^(mailto:|tel:)/i.test(value))return value;return "";}
export function normalizeDesignBlocks(value:unknown):PageDesignBlocks{
  const result:PageDesignBlocks={};if(!value||typeof value!=="object")return result;
  for(const page of Object.keys(designPages)){
    const blocks=(value as Record<string,unknown>)[page];if(!Array.isArray(blocks))continue;
    result[page]=blocks.slice(0,40).filter(b=>b&&typeof b==="object").map((b,index)=>({id:typeof b.id==="string"?b.id.slice(0,100):`block-${index}`,type:["text","card","image","button"].includes(b.type)?b.type:"text",title:String(b.title??"").slice(0,500),body:String(b.body??"").slice(0,10000),imageUrl:safeDesignUrl(b.imageUrl,true),href:safeDesignUrl(b.href),background:/^#[0-9a-f]{6}$/i.test(b.background)?b.background:"#ffffff",foreground:/^#[0-9a-f]{6}$/i.test(b.foreground)?b.foreground:"#14212d",gradient:b.gradient===true,animation:["fade","rise","gradient"].includes(b.animation)?b.animation:"none",textAnimation:["fade","rise"].includes(b.textAnimation)?b.textAnimation:"none",radius:typeof b.radius==="number"&&Number.isFinite(b.radius)?Math.min(40,Math.max(0,b.radius)):16}));
  }return result;
}
export function readableInk(background:string,foreground:string){
  const lum=(color:string)=>color.slice(1).match(/../g)!.map(n=>parseInt(n,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);
  const bg=lum(background),fg=lum(foreground);if((Math.max(bg,fg)+.05)/(Math.min(bg,fg)+.05)>=4.5)return foreground;return bg>.179?"#111111":"#ffffff";
}
