# Release verification — 2026-11-17

Environment: local production build, existing local PostgreSQL database. Production database was not modified.

## Passed
- Production build and TypeScript validation.
- ESLint: no errors; image optimization advisories and one existing route-loader dependency warning remain.
- Data integrity: six checks, including assignment/project relationships, month keys, fleet maintenance, company links, user links and duplicate slots.
- Role smoke suite: 17 checks, temporary local fixtures cleaned by the suite.
- HTTP suite: 34 checks including login/logout, protected routes and APIs, administrator pages, export-related panel content and transfer safeguards.
- Corporate/service pages, robots and sitemap respond successfully; protected dashboard redirects anonymous users and dashboard API returns 401.
- Corporate homepage DOM sizing at 320, 390, 768, 1024 and 1440 px: no document horizontal overflow or H1 overflow.
- Mobile navigation opens and closes; Escape closes and restores menu-button focus.

## Limits — not represented as passed
- Physical device and multiple browser-engine matrix not executed.
- Authenticated TransitOS visual flows, record creation/editing and PDF visual output not browser-tested in this run. Role and HTTP suites are not substitutes for these.
- No production deployment or post-deployment smoke verification performed by this test run.
- No penetration-test or blanket security certification claimed.

No advertising or AdSense integration is included.
