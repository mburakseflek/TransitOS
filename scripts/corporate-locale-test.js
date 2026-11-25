const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,"utf8"), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const { translate, corporateHref } = require("../src/lib/corporate-locale.ts");
const { languagePath } = require("../src/lib/language-path.ts");
const { corporateTranslations } = require("../src/lib/corporate-translations.ts");
const locales = ["eng","de","es","it","fr","zh"];
const sections = { "":"",services:"hizmetler",fleet:"filo",contact:"iletisim",vip:"vip",privileges:"ayricaliklar",standards:"standartlar",references:"referanslar" };
for (const [source,translations] of Object.entries(corporateTranslations)) {
  assert.equal(translate("tr",source),source);
  for (const locale of locales) assert.ok(translations[locale]?.trim(),`${locale}: ${source}`);
}
for (const locale of locales) {
  for (const [section,turkish] of Object.entries(sections)) {
    const original = `/seflektur${turkish?`/${turkish}`:""}`;
    const translated = `/${locale}${section?`/${section}`:""}`;
    assert.equal(corporateHref(locale,original),translated);
    assert.equal(languagePath("tr",translated),original);
    assert.equal(languagePath(locale,original),translated);
  }
  assert.equal(corporateHref(locale,"/transitos/dashboard"),"/transitos/dashboard");
}
console.log(`PASS Fixed dictionaries (${Object.keys(corporateTranslations).length} entries), routing and Turkish-only TransitOS`);

const base = process.env.TRANSITOS_TEST_URL || "http://127.0.0.1:3100";
const pattern = html => [...html.matchAll(/<section\b[^>]*class="([^"]*)"/g)].map(match=>match[1]);
async function main() {
  let count = 0;
  for (const [section,turkish] of Object.entries(sections)) {
    const response = await fetch(`${base}/seflektur${turkish?`/${turkish}`:""}`);
    assert.equal(response.status,200);
    const reference = pattern(await response.text());
    assert.ok(reference.length);
    for (const locale of locales) {
      const url = `${base}/${locale}${section?`/${section}`:""}`;
      const localized = await fetch(url);
      assert.equal(localized.status,200,url);
      const html = await localized.text();
      assert.deepEqual(pattern(html),reference,`Shared section layout: ${url}`);
      assert.ok(html.includes('class="corp-v2-header"'),url);
      assert.ok(html.includes('class="corp-v2-footer"'),url);
      assert.ok(html.includes('aria-label="Language / Dil"'),url);
      assert.ok(!html.includes('class="international-site"'),url);
      count++;
    }
  }
  console.log(`PASS Same corporate section structure, header, footer and globe control on ${count} localized pages`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
