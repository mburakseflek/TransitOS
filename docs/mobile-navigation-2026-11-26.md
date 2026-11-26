# Corporate mobile navigation correction

- Replaced the legacy floating mobile controls/backdrop/drawer with a safe-area-aware fixed header and reserved content space.
- Menu and language picker use native modal dialogs in the browser top layer. Their backdrop dims without blur and cannot cover dialog links.
- Dialogs constrain height to the visual viewport, scroll in landscape, lock background scrolling and support Escape, explicit close and outside dismissal.
- Removed the language picker's blur-triggered unmount. Selection explicitly navigates to its fixed locale route; the active marker is derived from the pathname rather than only a server prop.

## Verified on local production build

- Build and TypeScript passed; ESLint has zero errors, with 33 existing warnings.
- At 390×844, menu links navigated to fleet and contact.
- After scrolling 1688px, the mobile header remained at viewport top 0; menu target height was 48px.
- The opened menu matched `:modal`, its first link was the actual hit-test target, and backdrop blur was `none`.
- English, German, Spanish, Italian, French, Chinese and Turkish selections changed URL, main-content language and active language together while retaining the fleet page.
- At 844×390, the menu stayed within the viewport and was scrollable.
- At 320×640, the language dialog stayed inside the viewport; choosing English on contact opened `/eng/contact` with language `en` and active marker `English`.
- No operational records, invoice calculations or database schema were changed. These are browser checks, not physical-device certification.
