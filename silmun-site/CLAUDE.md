# Silmun marketing site

Marketing site for Silmun, which sells AI agents for ServiceNow on the ServiceNow Store.

Read `README.md` and `design-handoff/HANDOFF.md` first. It has the routes, design files, tokens, interactions, decisions and open items.

- `design-handoff/design/` holds the approved design mocks (desktop and mobile per page). Match them visually; don't copy their templating syntax.
- `src/styles/01-05` hold the design CSS in load order; `06-site.css` and `07-responsive.css` are the production layers. Reuse the tokens and class rules.
- `design-handoff/brand/` holds the logo mark.

Working rules:
- One responsive page per route, matching both the desktop (1440) and mobile (390) mocks.
- Plain-language copy. Keep the copy from the mocks unless asked to change it.
- No em dashes in copy.
- Sage (#72C49A) is only for "Live" status. Turquoise (#19C6B4) is the accent.
- Never invent stats, customer logos or testimonials.
- Nothing is sold on the site. Store buttons link out to the ServiceNow Store.
- Run `npm run build && npm run check:copy` before committing.
