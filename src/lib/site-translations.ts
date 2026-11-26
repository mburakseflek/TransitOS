export const editorLanguages = { eng: "English", de: "Deutsch", es: "Español", it: "Italiano", fr: "Français", zh: "中文" } as const;
export type SiteTranslations = Partial<Record<keyof typeof editorLanguages, Record<string,string>>>;
export function normalizeSiteTranslations(value: unknown): SiteTranslations {
  const result: SiteTranslations = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  for (const locale of Object.keys(editorLanguages) as (keyof typeof editorLanguages)[]) {
    const entries = (value as Record<string,unknown>)[locale];
    if (!entries || typeof entries !== "object" || Array.isArray(entries)) continue;
    result[locale] = Object.fromEntries(Object.entries(entries).slice(0,1500).filter(([key,text]) => key.length <= 8000 && typeof text === "string" && text.length <= 12000 && !["__proto__","constructor","prototype"].includes(key)).map(([key,text]) => [key,String(text)]));
  }
  return result;
}
