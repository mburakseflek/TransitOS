import Link from "next/link";
import { notFound } from "next/navigation";
import { servicePages } from "../service-pages";
import { createCorporateMetadata, createServiceJsonLd } from "../../seo";
import { SiteHeader, PageHero, SiteFooter } from "../../SiteChrome";
import { readSiteContent } from "@/lib/site-content";

export function generateStaticParams() { return servicePages.map(({slug})=>({slug})); }
export async function generateMetadata({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const service=servicePages.find(item=>item.slug===slug);
  return service ? createCorporateMetadata({title:service.title+" | Şeflek Tur",description:service.intro,path:"/seflektur/hizmetler/"+slug,image:service.image}) : {};
}
export default async function ServicePage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const service=servicePages.find(item=>item.slug===slug);
  if(!service) notFound();
  const content=await readSiteContent();
  const schema=createServiceJsonLd({name:service.title,description:service.intro,path:"/seflektur/hizmetler/"+slug,image:service.image});
  return <main className="new-site-page paged-site corp-v2">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}} />
    <SiteHeader />
    <PageHero eyebrow="Şeflek Tur hizmetleri" title={service.title} body={service.intro} imageUrl={service.image}>
      <div className="new-hero-actions"><Link className="new-primary" href="/seflektur/teklif">Teklif talep edin</Link><Link className="new-secondary" href="/seflektur/hizmetler">Tüm hizmetler</Link></div>
    </PageHero>
    <section className="service-guide"><div>{service.sections.map(([title,body])=><article key={title}><h2>{title}</h2><p>{body}</p></article>)}</div>
      <aside><h2>Teklif için hazırlayın</h2><ul>{service.needs.map(item=><li key={item}>{item}</li>)}</ul><Link href="/seflektur/teklif">Hizmet talebi oluşturun →</Link><p>Hizmet kapsamı ve uygunluk, talebiniz değerlendirildikten sonra netleştirilir.</p></aside>
    </section>
    <SiteFooter tickerItems={content.tickerItems} />
  </main>;
}
