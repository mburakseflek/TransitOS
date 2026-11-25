import { notFound, redirect } from "next/navigation";
import { languages, internationalCopy } from "@/lib/languages";
import { type CorporateLocale, corporateSections, translate } from "@/lib/corporate-locale";
import { languagePath } from "@/lib/language-path";
import ServicesView from "@/app/seflektur/views/ServicesView";
import FleetView from "@/app/seflektur/views/FleetView";
import ContactView from "@/app/seflektur/views/ContactView";
import VipView from "@/app/seflektur/views/VipView";
import PrivilegesView from "@/app/seflektur/views/PrivilegesView";
import StandardsView from "@/app/seflektur/views/StandardsView";
import ReferencesView from "@/app/seflektur/views/ReferencesView";
import type { Route } from "next";
const views={services:ServicesView,fleet:FleetView,contact:ContactView,vip:VipView,privileges:PrivilegesView,standards:StandardsView,references:ReferencesView};
const titles={services:"Hizmetler",fleet:"Filo",contact:"İletişim",vip:"VIP Araçlar",privileges:"Ayrıcalıklar",standards:"Belgeler ve Standartlar",references:"Referanslar"};
export function generateStaticParams() { return languages.flatMap(({code})=>Object.keys(corporateSections).map(section=>({locale:code,section}))); }
export async function generateMetadata({params}:{params:Promise<{locale:string;section:string}>}) {
 const {locale,section}=await params;const copy=internationalCopy[locale as keyof typeof internationalCopy];
 if(!copy || !Object.hasOwn(views,section)) return {};
 return {title:translate(locale as CorporateLocale,titles[section as keyof typeof titles])+" | Şeflek Tur",description:copy.intro,alternates:{canonical:"https://www.seflektur.com/"+locale+"/"+section,languages:Object.fromEntries(languages.map(l=>[l.code==="eng"?"en":l.code,"https://www.seflektur.com"+languagePath(l.code,"/"+locale+"/"+section)]))}};
}
export default async function LocalizedSection({params}:{params:Promise<{locale:string;section:string}>}) {
 const {locale,section}=await params;if(!Object.hasOwn(views,section)||!languages.some(l=>l.code===locale)) notFound();
 if(locale==="tr") redirect(languagePath("tr","/tr/"+section) as Route);
 const View=views[section as keyof typeof views];return <View locale={locale as CorporateLocale}/>;
}
