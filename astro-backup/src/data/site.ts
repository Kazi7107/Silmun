// Site-wide settings. Open launch items from HANDOFF.md section 8 live here,
// so they can be filled in without touching page markup.

export const SITE = {
  name: 'Silmun',
  // Open item 4: domain. Also set `site` in astro.config.mjs.
  url: 'https://silmun.com',
  // Open item 3: pick one support address.
  supportEmail: '', // e.g. 'support@silmun.com'
  // Privacy-friendly analytics. Leave empty to load no analytics script.
  plausibleDomain: '', // e.g. 'silmun.com'
};

export type AgentKey = 'catalog' | 'secops';

// Open item 1: ServiceNow Store listing URLs.
// While a URL is empty, every "Get it on the Store" button for that agent
// falls back to the agent's own #pricing section, as in the design.
export const STORE_URLS: Record<AgentKey, string> = {
  catalog: '',
  secops: '',
};

export const AGENT_PAGES: Record<AgentKey, string> = {
  catalog: '/itsm/catalog-automation/',
  secops: '/security-operations/vulnerability-remediation/',
};

export function storeHref(agent: AgentKey): string {
  return STORE_URLS[agent] || `${AGENT_PAGES[agent]}#pricing`;
}

export function isExternalStore(agent: AgentKey): boolean {
  return Boolean(STORE_URLS[agent]);
}

export const ROUTES = {
  home: '/',
  catalog: AGENT_PAGES.catalog,
  secops: AGENT_PAGES.secops,
  sourceToPay: '/source-to-pay/',
  about: '/about/',
  support: '/support/',
  contact: '/#contact',
};
