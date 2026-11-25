import { languages } from "./languages";

const sections: Record<string, string> = {
  hizmetler: "services", filo: "fleet", iletisim: "contact", teklif: "contact"
};
export function languagePath(code: string, pathname: string) {
  if (!languages.some(language => language.code === code)) return "/";
  const parts = pathname.split("/").filter(Boolean);
  const section = parts[0] === "seflektur" ? sections[parts[1]] : parts[1];
  const supported = ["services", "fleet", "contact"].includes(section) ? section : "";
  if (code === "tr") {
    const target = { services: "hizmetler", fleet: "filo", contact: "iletisim" }[supported];
    return target ? `/seflektur/${target}` : "/seflektur";
  }
  return `/${code}${supported ? `/${supported}` : ""}`;
}
