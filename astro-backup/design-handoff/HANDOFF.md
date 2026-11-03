# Silmun marketing site · build handoff

Design source for the real build. Everything in `design/` is a static design mock exported from the Claude design canvas. Rebuild it as a production site; don't ship these files as-is.

Last design pass: Nov 1, 2026.

## 1. What the site is

Silmun builds AI agents that run inside ServiceNow and are sold on the **ServiceNow Store**. The site explains each agent and sends buyers to the Store listing. **Nothing is sold on the site itself.** Purchases happen in the Store (Request purchase / Contact seller), and installs happen from the customer's ServiceNow Application Manager.

Audience: ServiceNow platform owners, catalog admins, vulnerability management and security ops leads. Voice: plain, short, no jargon. Explain ServiceNow terms when they have to appear.

## 2. Pages and routes

| Route | Desktop design | Mobile design | Notes |
|---|---|---|---|
| `/` | `desktop/Main.dc.html` | `mobile/HomeMobile.dc.html` | Hero, modules, how agents work, about teaser, contact form |
| `/itsm/catalog-automation` | `desktop/Catalog.dc.html` | `mobile/CatalogMobile.dc.html` | Live agent. What it does, why us, how it works, pricing, feedback |
| `/security-operations/vulnerability-remediation` | `desktop/Orchestrator.dc.html` | `mobile/OrchestratorMobile.dc.html` | Live agent. 8 use cases, same section order |
| `/source-to-pay` | `desktop/SourceToPay.dc.html` | `mobile/SourceToPayMobile.dc.html` | "Next module" page with a feedback form |
| `/about` | `desktop/About.dc.html` | `mobile/AboutMobile.dc.html` | Company, two kinds of agents, library |
| `/support` | `desktop/Support.dc.html` | `mobile/SupportMobile.dc.html` | Email form only. No sign-in, no case tracking |

`design/states/` shows the open Modules dropdown and the open mobile menu. `design/reference/System.dc.html` is the design system sheet (palette, components).

Desktop boards are 1440 wide, mobile boards 390. Build one responsive page per route, not separate mobile pages. The mobile boards show how each section should collapse.

## 3. How to read the design files

The `.dc.html` files use a small templating layer from the design tool. Treat them as markup + intent:

- `{{name}}` holes are values from the `Component` class at the bottom of each file (`renderVals()`).
- `<sc-if value="{{x}}">` = conditional render. `<sc-for list="{{xs}}" as="x">` = loop.
- `onClick="{{fn}}"` = event handler defined in `renderVals()`.
- `<helmet>` = head content (fonts, page styles).
- `support.js` and the `/_blob/...` stylesheet links are design-tool plumbing. The real CSS is in `styles/`.
- Class names (`tag-live`, `mod`, `tier`, `vrec`, `amock`, etc.) map to rules in `styles/`.

## 4. Styles

Load in this order (each layer overrides the one before):

1. `01-base.css`: tokens, type, layout, nav, buttons, forms, tags
2. `02-components.css`: module cards, mocks, callouts, approval demo, pricing
3. `03-pages.css`: reasons, steps, use case list, tiers, about page pieces
4. `04-accent.css`: turquoise accent, hover states, dark-section depth, faint hero grid
5. `05-editorial.css`: big type scale, black hairlines, headline highlighter (`.hlw`)

Fine to consolidate into one stylesheet or CSS modules, but keep the visual result. Some rules in 01-03 are overridden later and can be dropped during cleanup.

### Tokens

| Token | Value | Use |
|---|---|---|
| ink | `#1A2B30` | Text, hairlines, primary buttons |
| deep teal | `#0E2A31` | Dark sections, highlighted pricing plan |
| bg | `#F3F6F6` | Page background |
| surface | `#FFFFFF` | Cards, forms |
| sage | `#72C49A` (ink `#2B7350`) | **Status only: "Live" tags** |
| turquoise accent | `#19C6B4` (ink `#0C7A6E`, soft `#E7FAF7`, highlighter `#C9F2EC`) | Section numbers, headline highlighter, step numbers, Pro plan strip, links |
| line | `#DDE4E5`, rules `#1A2B30` | Borders |

Type: **Instrument Sans** (UI and headlines), **JetBrains Mono** (labels, section numbers, data). Google Fonts.
Headlines: 76px desktop / 44px mobile, tight tracking. One word per headline gets the `.hlw` highlighter.

Rules: sage means "live" and nothing else. No glow effects in heroes (tried and rejected). No module-specific colors (tried and rejected).

## 5. Interactions to rebuild

- **Modules dropdown** in the top nav (desktop), full-screen **menu** on mobile.
- **Reveal on scroll**: sections with `data-reveal` fade in once (IntersectionObserver, 3s fallback shows everything). Respect `prefers-reduced-motion`.
- **Catalog hero mock**: field values flip from "empty" to filled, and the status flips to "Ready for review". Numbered callouts 1-3 update a caption bar on hover/tap.
- **Security Operations demo**: Confirm / Override / Reset buttons change the record's Team field and the recommendation status. Sample data only.
- **Forms** (contact, three feedback forms, Source to Pay feedback, support): currently fake "Sent" states. Need a real backend (see 7).
- "Get it on the Store" buttons currently jump to `#pricing`. Point them at each app's Store listing once the URLs exist.

## 6. Content decisions already made

- Brand: **Silmun**, wordmark lowercase `silmun` in Instrument Sans for now. Logo mark: `brand/logo-mark.svg` (the "Unbroken" S line). Custom wordmark not drawn yet.
- Nav: Modules (ITSM, Security Operations, Source to Pay · next), About us, Support, Contact.
- Both agents are **live** at launch, and all **8 Security Operations use cases** are live at launch.
- Catalog Automation runs on the customer's **own OpenAI key**, no Now Assist needed. Security Operations runs on **AI Agent Studio** and needs **Now Assist**.
- Pricing shown is **example pricing**, Pro is the highlighted plan, Enterprise is the high anchor:
  - Catalog Automation: $19 / $49 / $249 per month
  - Security Operations: $39 / $99 / $499 per month
- Support is a plain email form (sign-in and case tracking were cut).
- No fake stats, logos or testimonials anywhere.

## 7. Recommended stack

- **Astro** static site: fast, mostly HTML, small JS islands only for the dropdown, menu, hero mock and demo. Next.js also fine if the team prefers React.
- **Hosting:** Netlify or Vercel. Netlify Forms handles all six forms with no backend code. On Vercel, use Formspree or a small serverless function that emails the support inbox.
- **SEO:** per-page title and description, Open Graph image, sitemap.xml, robots.txt, canonical URLs.
- **Analytics:** privacy-friendly option (Plausible or similar), events on Store button clicks and form submits.
- **Accessibility:** keyboard-reachable dropdown and menu, visible focus, labelled form fields (already in the designs), alt text on mocks (`role="img"` + `aria-label` already written).

## 8. Open items before launch

1. Store listing URLs for both apps (every "Get it on the Store" button).
2. Final prices and plan contents, and how plans map to Store listings (one listing with quotes vs one per plan). Check with the ServiceNow partner manager.
3. Support email: `fsaeed@silmuninc.com` vs `support@silmun.com`. Pick one; it's a placeholder on the Support page.
4. Domain.
5. Catalog Automation version (1.0.2 vs 1.0.3) and whether the Australia release is tested (shown as a placeholder in the security details).
6. Demo video for Catalog Automation (placeholder player).
7. Customer proof (a quote or a measured result) for the Why us sections once a pilot runs.
8. Custom wordmark (optional, current lowercase type works).
9. `[YEAR]` in footers: render the current year.
