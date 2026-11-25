# Shared corporate presentation

The Turkish homepage and seven main content pages now render the same view components as the six international languages. There is no separate international landing-page theme.

- Shared views: home, services, fleet, contact, VIP, advantages, standards and references.
- Shared header, mobile navigation, hero, cards, footer, appearance settings and introduction animation.
- Fixed editorial dictionaries render on the server. Client controls receive only the small labels they need.
- Globe disclosure: native-language links, selected-language check, outside-click closing, Escape and restored trigger focus.
- Existing company identities, addresses, images and business records are not rewritten.
- The TransitOS application remains Turkish.

## Verification

- Production build and TypeScript passed.
- ESLint has no errors (existing image/hook warnings remain).
- `npm run test:locale` validates dictionary entries, locale routes and shared section structure across 48 localized pages. Run against the local production server on port 3100, or set `TRANSITOS_TEST_URL`.
- Existing HTTP smoke suite passed.
- Browser checks at 320, 768 and 1440 pixels covered all six foreign-language homepages. German compound-word overflow was fixed and rechecked at all three widths.
- Mobile at 390 pixels: language list fits; English fleet → German fleet preserves location; Escape closes and restores focus.

## Scope

Quotation/carrier forms, individual service guides and administrator-authored custom page bodies still use their existing Turkish routes. Unknown future editor text is preserved, not silently replaced or sent to a translation provider; it needs an editorial dictionary entry for each language. Live rollout must be checked separately from a successful Git push.
