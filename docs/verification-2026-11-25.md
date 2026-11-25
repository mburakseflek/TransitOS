# Verification — 25 November 2026

## Completed in this pass

- Fixed international services, fleet and contact routes for six languages, sitemap entries and corresponding language-switch destinations.
- Root language redirects run before streaming and are private/no-store; explicit language cookies take precedence over browser language.
- Restricted the global summary API to managers; today's service count now uses the Istanbul calendar day.
- Preserved saved appearance on malformed or absent editor input; invalidated localized content after saving.
- Retained the previous macOS snapshot fix: subcontractors do not receive customer pricing, and missing subcontractor scope is rejected.

## Verified

- Production build and TypeScript compilation passed.
- ESLint: zero errors, 38 warnings (predominantly existing image optimization warnings).
- Six local data integrity checks passed.
- Seventeen local role/business-rule checks passed.
- All HTTP smoke checks passed, including 24 international routes and eight additional role access checks.
- Browser: English services page at 390px had document width 390px; switching to German retained `/services`.

## Not certified / remaining work

- This is not a complete translation of every Turkish corporate page. Service detail, VIP, references, standards, custom pages and application forms still need full editorial translation.
- Automatic selection uses browser language, not verified visitor country.
- The full TransitOS redesign, authenticated interaction regression suite and PDF pagination visual checks have not been completed in this pass.
- No existing invoice was recalculated or overwritten. Historical document price disputes require reviewing the specific issued document and its saved lines.
- No live deployment or physical-device certification was performed.
- Local smoke tests record login/visit audit events and create then remove their own role-test fixtures; business records were not migrated.
