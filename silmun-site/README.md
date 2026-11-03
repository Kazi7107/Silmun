# Silmun marketing site

Astro static site built from the design handoff in `design-handoff/` (see `design-handoff/HANDOFF.md`).

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # outputs dist/
npm run check:copy   # copy rules: no em dashes, no [YEAR], no design-tool links; lists open placeholders
```

## Routes

| Route | Page |
|---|---|
| `/` | `src/pages/index.astro` |
| `/itsm/catalog-automation/` | `src/pages/itsm/catalog-automation.astro` |
| `/security-operations/vulnerability-remediation/` | `src/pages/security-operations/vulnerability-remediation.astro` |
| `/source-to-pay/` | `src/pages/source-to-pay.astro` |
| `/about/` | `src/pages/about.astro` |
| `/support/` | `src/pages/support.astro` |
| `/thanks/` | No-JS form fallback (noindex, not in sitemap) |

## Where things live

- `src/data/site.ts`: domain, Store URLs, support email, analytics domain. **Most launch open items are filled in here.**
- `src/data/pricing.ts`: example pricing for both agents.
- `src/styles/01-05`: design CSS, unchanged from the handoff, in load order.
- `src/styles/06-site.css`: page layout classes that replace the mocks' inline styles, plus forms, a11y and demo state.
- `src/styles/07-responsive.css`: fluid type and the collapse to the 390px boards. Breakpoints: 1080 (tablet), 1000 (hero mock stacks), 860 (mobile nav, chips, sticky Store bar), 640 (phone densities).
- `src/scripts/site.ts`: dropdown, mobile menu, reveal on scroll, scrollspy, hero callouts, Security Operations demo, form submit, analytics events.

## Behaviour notes

- **Store buttons**: every "Get it on the Store" button goes through `StoreButton.astro`. While `STORE_URLS` is empty it links to the agent's `#pricing`. Once a URL is set, it opens the Store in a new tab.
- **Forms**: all five (contact, two agent feedback forms, Source to Pay, support) use Netlify Forms (`data-netlify`, honeypot). With JS they submit in place and show the design's "Sent" label; without JS they post and land on `/thanks/`. Set up email notifications per form in the Netlify UI. Local dev has no form backend, so a submit shows the error message.
- **Analytics**: set `SITE.plausibleDomain` to load Plausible. Events: `Store click` (props `agent`, `page`) and `Form submit` (prop `form`).
- **Reveal**: `[data-reveal]` sections fade in once. Content is visible without JS, and with `prefers-reduced-motion` nothing moves.
- **Footer year** renders at build time.

## Deploy (Netlify)

`netlify.toml` is included: build `npm run build`, publish `dist`. Connect the repo, deploy, then turn on form notifications.

## Open before launch (from HANDOFF.md section 8)

1. Store listing URLs → `STORE_URLS` in `src/data/site.ts`
2. Final prices and plan contents → `src/data/pricing.ts`
3. Support email → `SITE.supportEmail` (replaces the `[support@silmun...]` placeholder)
4. Domain → `SITE.url`, `site` in `astro.config.mjs`, `public/robots.txt`
5. Catalog Automation version / Australia release → the `[Australia: confirm]` placeholder on the Catalog page
6. Demo video → the placeholder player on the Catalog page (play button is disabled for now)
7. Customer proof for the Why us sections (none invented)
8. Custom wordmark (optional)
