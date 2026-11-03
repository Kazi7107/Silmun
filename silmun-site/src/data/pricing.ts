// Open item 2: example pricing. Final prices and plan contents still need
// confirming with the ServiceNow partner manager.

export interface Tier {
  name: string;
  forWho: string;
  price: number;
  features: string[];
  highlight?: boolean;
  cta: { label: string; to: 'store' | 'contact' };
}

export const CATALOG_TIERS: Tier[] = [
  {
    name: 'Essential',
    forWho: 'For a team building its first items',
    price: 19,
    features: [
      'Build items from plain text',
      'Review and edit before building',
      'Up to 25 items a month',
      'Email support, 1 business day',
    ],
    cta: { label: 'Get Essential', to: 'store' },
  },
  {
    name: 'Pro',
    forWho: 'For catalog teams shipping every week',
    price: 49,
    highlight: true,
    features: [
      'Everything in Essential',
      'Unlimited items',
      'Duplicate name checks and overwrite control',
      'Full request log for audits',
    ],
    cta: { label: 'Get Pro', to: 'store' },
  },
  {
    name: 'Enterprise',
    forWho: 'For large catalogs across instances',
    price: 249,
    features: [
      'Everything in Pro',
      'Test and production instances',
      'Guided onboarding session',
      '1-hour response on critical issues',
    ],
    cta: { label: 'Talk to us', to: 'contact' },
  },
];

export const SECOPS_TIERS: Tier[] = [
  {
    name: 'Essential',
    forWho: 'Find owners and confirm fixes',
    price: 39,
    features: [
      'No owner (01)',
      'Patched, still open (07)',
      'Unknown hardware (08)',
      'Email support, 1 business day',
    ],
    cta: { label: 'Get Essential', to: 'store' },
  },
  {
    name: 'Pro',
    forWho: 'Get stuck fixes moving',
    price: 99,
    highlight: true,
    features: [
      'Everything in Essential',
      'Patch blocked (03)',
      'Records disagree (05)',
      'Stalled task (06)',
    ],
    cta: { label: 'Get Pro', to: 'store' },
  },
  {
    name: 'Enterprise',
    forWho: 'Every use case, every team',
    price: 499,
    features: [
      'All 8, including Many teams (02) and No patch yet (04)',
      'Guided onboarding session',
      'Priority support',
    ],
    cta: { label: 'Talk to us', to: 'contact' },
  },
];
