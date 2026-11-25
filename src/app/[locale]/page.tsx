import { notFound, redirect } from "next/navigation";
import { internationalCopy, languages } from "@/lib/languages";
import { LanguagePicker } from "@/app/components/LanguagePicker";
import { readSiteContent } from "@/lib/site-content";
export function generateStaticParams(){return languages.map(l=>({locale:l.code}));}
export async function generateMetadata({params}:{params:Promise<{locale:string}>}){const {locale}=await params;const c=internationalCopy[locale as keyof typeof internationalCopy];if(!c)return {};return {title:`Şeflek Tur | ${c.title}`,description:c.intro,alternates:{canonical:`https://www.seflektur.com/${locale}`,languages:Object.fromEntries(languages.map(l=>[l.code==="eng"?"en":l.code,`https://www.seflektur.com/${l.code}`]))}};}
export default async function InternationalPage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(locale==="tr")redirect("/seflektur");const c=internationalCopy[locale as keyof typeof internationalCopy];if(!c)notFound();const content=await readSiteContent();
 return <main className="international-site" lang={c.lang}>
  <header><a href={`/${locale}`}><img src="/brand/seflek-logo-navy.png" width="180" height="70" alt="Şeflek Tur" /></a><LanguagePicker current={locale}/></header>
  <nav aria-label={c.services}><a href={`/${locale}/services`}>{c.services}</a><a href={`/${locale}/fleet`}>{c.fleet}</a><a href={`/${locale}/contact`}>{c.contact}</a></nav>
  <section className="international-hero"><div><span>ŞEFLEK TUR · ISTANBUL</span><h1>{c.title}</h1><p>{c.intro}</p><a className="international-cta" href="#contact">{c.contact}</a></div><img src={content.homeHeroImageUrl} width="900" height="650" alt="Şeflek Tur" /></section>
  <section><h2>{c.services}</h2><div className="international-services">{c.items.map((item,i)=><article key={item}><small>0{i+1}</small><h3>{item}</h3></article>)}</div></section>
  <section><h2>{c.fleet}</h2><p>{c.fleetBody}</p></section>
  <section id="contact"><h2>{c.process}</h2><p>{c.body}</p><a href={`mailto:${content.contactEmail}`}>{content.contactEmail}</a><br/><a href={`tel:${content.contactPhone.replace(/[^+\d]/g,"")}`}>{content.contactPhone}</a><p>{c.note}</p></section><footer>© Şeflek Tur</footer>
 </main>;
}
