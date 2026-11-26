# Moderator design studio

The moderator editor now opens a full-screen properties workspace with a same-origin real-page preview. Changes remain drafts until the existing authenticated save action is submitted.

## Available controls

- Shared typography, accent, content width, section spacing, card padding/radius, image/button radius.
- New text, card, image and link/button blocks on eight corporate page types. Image upload uses the existing authenticated upload endpoint.
- Block duplicate/remove/reorder, desktop HTML drag-and-drop and accessible up/down buttons for touch/keyboard.
- Static gradient, fade/rise entrance and finite gradient-background motion. Reduced-motion disables motion.
- Separate six-language text overrides; Turkish operational/identity fields remain unchanged. Overrides are used by main view copy, CMS copy, header/footer and new blocks.
- Undo/redo in the parent toolbar, capped at 30 snapshots.

## Scope

This is a structured editor, not a free-positioned Photoshop canvas. New blocks are appended to each page's designated lower content area. Existing business modules cannot be dragged or deleted. Some secondary fixed copy (e.g. helper component labels and metadata) still uses the built-in translation catalog. Language text preview updates after saving; appearance and newly added blocks preview without publication.

## Safety

Server validates block types, animation enum, color syntax, dimensions, counts and text lengths; rejects script/data/protocol-relative/control-character links. React escapes text. Low-contrast block text is replaced with readable black/white. No custom HTML, CSS or JavaScript is accepted. DB-mode write failure now errors rather than falling back to a misleading local file save. Card serialization uses JSON, preserving pipes/newlines and empty collections.

## Verification

- Production build and TypeScript passed.
- Design validation/translation isolation tests passed.
- Local authenticated server-action integration passed: save → rendered localized content/styles → editor reload → restore original content.
- Existing HTTP smoke checks passed with local database running.
- Locale regression checks passed (48 pages / 259 dictionary entries).
- Local database integrity checks passed (six categories).
- Production dependency audit: zero known vulnerabilities reported. This does not constitute a full penetration test.
- Browser confirmed unauthenticated editor access redirects to login. Authenticated pointer/touch interaction and every real device have not been manually certified.

Commands: `node scripts/design-studio-test.js`, `node scripts/design-studio-save-test.js` (local-only integration; requires local server/database and configured test admin), `npm run test:locale`, `npm run build`.
