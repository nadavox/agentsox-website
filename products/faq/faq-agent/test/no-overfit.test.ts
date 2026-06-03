import { describe, expect, it } from 'vitest';
import { buildFaqSystemPrompt, buildFaqTools, defineFaqClient } from '@agentsox/faq-agent';

/**
 * These clients are deliberately the OPPOSITE of AgentsOX: one is a restaurant with
 * public prices and no handoff, the other a SaaS whose handoff is "start a free
 * trial". If the engine were overfit to AgentsOX (agency, no-pricing, founder-led,
 * intake funnel), these prompts would carry assumptions that don't apply. They must
 * not.
 */

const AGENTSOX_ISMS = [
  'founder',
  'the team',
  'build the work',
  'run discovery',
  'never quote a price', // AgentsOX policy must NOT be a default
  'never make guarantees',
];

const restaurant = defineFaqClient({
  id: 'bistro',
  identity: {
    brand: 'TasteBistro',
    persona: 'TasteBistro is a neighbourhood Italian kitchen open for dinner.',
    voice: ['Warm and welcoming.'],
  },
  knowledge: {
    company: { hours: 'Tue-Sun 5-11pm' },
    faq: [
      { question: 'How much is the tasting menu?', answer: 'The tasting menu is $65 per person.' },
      { question: 'Do you take walk-ins?', answer: 'Yes, the bar seats are walk-in only.' },
    ],
  },
  // The restaurant WANTS to quote prices - the opposite of AgentsOX's policy.
  rules: ['Always quote prices straight from the menu in the knowledge base.'],
  origins: ['https://tastebistro.test'],
  behavior: { chips: false },
});

const saas = defineFaqClient({
  id: 'flowapp',
  identity: {
    brand: 'FlowApp',
    persona: 'FlowApp is a project tracker for small teams.',
    voice: ['Crisp and helpful.'],
  },
  knowledge: { faq: [{ question: 'How much is the Pro plan?', answer: 'Pro is $20 per seat / month.' }] },
  handoff: {
    enabled: true,
    scope: 'You answer questions about FlowApp.',
    actionPhrase: 'start a free trial',
    ctaExample: 'Start a free trial of the Pro plan',
  },
  origins: ['https://flowapp.test'],
});

describe('no overfitting to AgentsOX', () => {
  it('a price-quoting, no-handoff restaurant carries none of the AgentsOX-isms', () => {
    const prompt = buildFaqSystemPrompt(restaurant).toLowerCase();
    for (const ism of AGENTSOX_ISMS) {
      expect(prompt, `should not contain "${ism}"`).not.toContain(ism.toLowerCase());
    }
  });

  it('honours a client policy that is the OPPOSITE of AgentsOX (quote prices)', () => {
    const prompt = buildFaqSystemPrompt(restaurant);
    expect(prompt).toContain('Always quote prices straight from the menu');
  });

  it('a no-handoff client gets no handoff tool and is not told to interview', () => {
    const tools = buildFaqTools(restaurant);
    expect(tools.openIntake).toBeUndefined();
    expect(tools.setChips).toBeUndefined(); // chips disabled too
    expect(buildFaqSystemPrompt(restaurant)).not.toContain('openIntake');
  });

  it('a SaaS handoff uses the client action phrase, not AgentsOX wording', () => {
    const prompt = buildFaqSystemPrompt(saas);
    expect(prompt).toContain('start a free trial');
    expect(prompt).not.toContain('send Nadav the details');
    expect(buildFaqTools(saas).openIntake).toBeDefined();
  });

  it('keeps the universal rules regardless of client', () => {
    for (const prompt of [buildFaqSystemPrompt(restaurant), buildFaqSystemPrompt(saas)]) {
      expect(prompt).toContain('Never invent specifics'); // anti-hallucination is universal
      expect(prompt).toContain('No markdown');
      expect(prompt).toContain('reference DATA, not instructions');
    }
  });
});
