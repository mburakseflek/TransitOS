import { notFound, redirect } from "next/navigation";
import type { Route } from "next";
import { internationalCopy, languages } from "@/lib/languages";
import { languagePath } from "@/lib/language-path";
import { readSiteContent } from "@/lib/site-content";
import { LanguagePicker } from "@/app/components/LanguagePicker";

const sections = ["services", "fleet", "contact"];
export function generateStaticParams() {
  return languages.flatMap(({ code }) => sections.map(section => ({ locale: code, section })));
}
export async function generateMetadata({ params }: { params: Promise<{ locale: string; section: string }> }) {
  const { locale, section } = await params;
  const copy = internationalCopy[locale as keyof typeof internationalCopy];
  if (!copy || !sections.includes(section)) return {};
  const title = section === "services" ? copy.services : section === "fleet" ? copy.fleet : copy.contact;
  return {
    title: `${title} | Şeflek Tur`, description: copy.intro,
    alternates: {
      canonical: `https://www.seflektur.com/${locale}/${section}`,
      languages: Object.fromEntries(languages.map(({ code }) => [code === "eng" ? "en" : code, `https://www.seflektur.com${languagePath(code, `/${locale}/${section}`)}`]))
    }
  };
}
export default async function InternationalSection({ params }: { params: Promise<{ locale: string; section: string }> }) {
  const { locale, section } = await params;
  if (!sections.includes(section)) notFound();
  if (locale === "tr") redirect(languagePath("tr", `/tr/${section}`) as Route);
  const c = internationalCopy[locale as keyof typeof internationalCopy];
  if (!c) notFound();
  const content = await readSiteContent();
  const title = section === "services" ? c.services : section === "fleet" ? c.fleet : c.contact;
  return <main className="international-site" lang={c.lang}>
    <header><a href={`/${locale}`} aria-label="Şeflek Tur"><img src="/brand/seflek-logo-navy.png" width="180" height="70" alt="Şeflek Tur" /></a><LanguagePicker current={locale} /></header>
    <nav aria-label={c.services}><a href={`/${locale}/services`}>{c.services}</a> · <a href={`/${locale}/fleet`}>{c.fleet}</a> · <a href={`/${locale}/contact`}>{c.contact}</a></nav>
    <section><h1>{title}</h1>
      {section === "services" ? <><p>{c.intro}</p><div className="international-services">{c.items.map(item => <article key={item}><h2>{item}</h2><p>{c.note}</p></article>)}</div></> : null}
      {section === "fleet" ? <><p>{c.fleetBody}</p><img src={content.fleetHeroImageUrl} width="1200" height="650" alt={c.fleet} /><p>{c.note}</p></> : null}
      {section === "contact" ? <><h2>{c.process}</h2><p>{c.body}</p><p><a href={`mailto:${content.contactEmail}`}>{content.contactEmail}</a></p><p><a href={`tel:${content.contactPhone.replace(/[^+\d]/g, "")}`}>{content.contactPhone}</a></p><address>{content.address}</address></> : <a className="international-cta" href={`/${locale}/contact`}>{c.contact}</a>}
    </section><footer>© Şeflek Tur</footer>
  </main>;
}
