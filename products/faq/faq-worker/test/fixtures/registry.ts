import { defineFaqClient, defineFaqClientRegistry } from '@agentsox/faq-agent';

/**
 * Test-only clients. These live under test/ and are ONLY assembled into a registry
 * here, so they can never reach the production registry in src/clients.
 */
export const acmeFixture = defineFaqClient({
  id: 'acme-test',
  identity: { brand: 'Acme', persona: 'Acme builds widgets.', voice: ['Be brief.'] },
  knowledge: { faq: [{ question: 'What is Acme?', answer: 'A widget shop.' }] },
  origins: ['https://acme.test'],
});

// A second client so its origin is in the union baseline - lets us send a request
// from an origin that passes the coarse check but fails acme's per-client binding.
export const betaFixture = defineFaqClient({
  id: 'beta-test',
  identity: { brand: 'Beta', persona: 'Beta builds gadgets.', voice: ['Be brief.'] },
  knowledge: { faq: [{ question: 'What is Beta?', answer: 'A gadget shop.' }] },
  origins: ['https://other.test'],
});

export const fixtureRegistry = defineFaqClientRegistry([acmeFixture, betaFixture]);
