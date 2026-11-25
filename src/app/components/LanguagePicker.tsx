"use client";
import { languages } from "@/lib/languages";
export function LanguagePicker({current="tr"}:{current?:string}) {
 return <label className="language-picker"><span>Language</span><select aria-label="Language" value={current} onChange={e=>{const code=e.target.value;if(!languages.some(l=>l.code===code))return;document.cookie=`site_language=${code}; Path=/; Max-Age=31536000; SameSite=Lax`;location.assign(code==="tr"?"/tr":"/"+code);}}>{languages.map(l=><option value={l.code} key={l.code}>{l.label}</option>)}</select></label>;
}
