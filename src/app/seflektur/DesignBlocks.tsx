import {readSiteContent} from "@/lib/site-content";
import {normalizeDesignBlocks,readableInk} from "@/lib/design-blocks";
import {translate,type CorporateLocale} from "@/lib/corporate-locale";
export async function DesignBlocks({page,locale="tr"}:{page:string;locale?:CorporateLocale}){
 const content=await readSiteContent(),blocks=normalizeDesignBlocks(content.designBlocks)[page]||[];
 const t=(text:string)=>translate(locale,text,locale==="tr"?undefined:content.translations?.[locale]);
 if(!blocks.length)return null;
 return <section className="studio-public-blocks" aria-label={t("İçerik")} >{blocks.map(block=><article key={block.id} className={`studio-public-block studio-block-${block.type} studio-motion-${block.animation}`} style={{background:block.gradient?`linear-gradient(120deg,${block.background},color-mix(in srgb,${block.background} 90%,black),${block.background})`:block.background,color:readableInk(block.background,block.foreground),borderRadius:block.radius}}>
 {block.type==="image"&&block.imageUrl?<img src={block.imageUrl} alt={t(block.title)} loading="lazy" decoding="async"/>:null}
 {block.type!=="button"&&block.title?<h2 className={`studio-motion-${block.textAnimation || "none"}`}>{t(block.title)}</h2>:null}{block.type!=="button"&&block.body?<p className={`studio-motion-${block.textAnimation || "none"}`}>{t(block.body)}</p>:null}
 {block.href?<a href={block.href} className="studio-public-button">{t(block.type==="button"?block.title: block.body?"İnceleyin":block.title)}</a>:null}
 </article>)}</section>;
}
