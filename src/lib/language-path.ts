import { languages } from "./languages";
import { corporateSections } from "./corporate-routes";

const sections: Record<string, string> = {
  ...Object.fromEntries(Object.entries(corporateSections).map(([key,value]) => [value,key])), teklif: "contact"
};
export function languagePath(code: string, pathname: string) {
  if (!languages.some(language => language.code === code)) return "/";
  const parts = pathname.split("/").filter(Boolean);
  const section = parts[0] === "seflektur" ? sections[parts[1]] : parts[1];
  const supported = Object.hasOwn(corporateSections, section) ? section as keyof typeof corporateSections : undefined;
  if (code === "tr") {
    const target = supported ? corporateSections[supported] : undefined;
    return target ? `/seflektur/${target}` : "/seflektur";
  }
  return `/${code}${supported ? `/${supported}` : ""}`;
}
