import { describe, expect, it } from 'vitest';
import { buildFaqTools, defineFaqClient } from '@agentsox/faq-agent';

const base = {
  id: 'acme',
  identity: { brand: 'Acme', persona: 'Acme builds widgets.', voice: ['Be brief.'] },
  knowledge: { faq: [{ question: 'What is Acme?', answer: 'A widget shop.' }] },
  origins: ['https://acme.test'],
};

describe('buildFaqTools', () => {
  it('includes openIntake + setChips when handoff and chips are on, with stable wire names', () => {
    const tools = buildFaqTools(
      defineFaqClient({
        ...base,
        handoff: { enabled: true, scope: 's', actionPhrase: 'book a call', ctaExample: 'c' },
      }),
    );
    expect(Object.keys(tools).sort()).toEqual(['openIntake', 'setChips']);
  });

  it('omits openIntake when the tenant has no handoff', () => {
    const tools = buildFaqTools(defineFaqClient(base));
    expect(tools.openIntake).toBeUndefined();
    expect(tools.setChips).toBeDefined();
  });

  it('omits openIntake when handoff is explicitly disabled', () => {
    const tools = buildFaqTools(
      defineFaqClient({
        ...base,
        handoff: { enabled: false, scope: 's', actionPhrase: 'x', ctaExample: 'c' },
      }),
    );
    expect(tools.openIntake).toBeUndefined();
  });

  it('omits setChips when chips are disabled', () => {
    const tools = buildFaqTools(defineFaqClient({ ...base, behavior: { chips: false } }));
    expect(tools.setChips).toBeUndefined();
  });
});
