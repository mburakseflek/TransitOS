import { notFound, redirect } from "next/navigation";
import HomeView from "@/app/seflektur/views/HomeView";
import { languages, internationalCopy } from "@/lib/languages";
import type { CorporateLocale } from "@/lib/corporate-locale";
export function generateStaticParams() { return languages.map(({code}) => ({locale:code})); }
export async function generateMetadata({params}:{params:Promise<{locale:string}>}) {
 const {locale}=await params;
 const copy=internationalCopy[locale as keyof typeof internationalCopy];
 if (!copy) return {};
 return {title:copy.title+" | Şeflek Tur",description:copy.intro,alternates:{canonical:"https://www.seflektur.com/"+locale,languages:Object.fromEntries(languages.map(l=>[l.code==="eng"?"en":l.code,"https://www.seflektur.com/"+l.code]))}};
}
export default async function LocalizedHome({params}:{params:Promise<{locale:string}>}) {
 const {locale}=await params;
 if(locale==="tr") redirect("/seflektur");
 if(!languages.some(l=>l.code===locale)) notFound();
 return <HomeView locale={locale as CorporateLocale}/>;
}
