import { buildFaqSystemPrompt } from '@agentsox/faq-agent';
import { describe, expect, it } from 'vitest';
import { agentsoxFaqClient } from '../src/clients/agentsox';

// Regression guard for the real AgentsOX config: extracting the prompt into a
// config must not drop any of the AgentsOX-specific wording or the generic rules.
describe('AgentsOX client prompt (nothing lost in extraction)', () => {
  const prompt = buildFaqSystemPrompt(agentsoxFaqClient);

  it('carries the AgentsOX identity and handoff wording', () => {
    expect(prompt).toContain('AgentsOX');
    expect(prompt).toContain('Nadav');
    expect(prompt).toContain('send Nadav the details');
  });

  it('carries the generic hard rules', () => {
    expect(prompt).toContain('Never invent specifics');
    expect(prompt).toContain('No markdown');
    expect(prompt).toContain('Write only your own reply');
  });

  it('still enforces the AgentsOX pricing policy (now via config rules, not the engine)', () => {
    expect(prompt).toContain('Never quote a price or a timeline');
    expect(prompt).toContain('never make guarantees');
  });

  it('serves production origins only (no localhost baked in)', () => {
    expect(agentsoxFaqClient.origins).toEqual([
      'https://agentsox.com',
      'https://www.agentsox.com',
    ]);
  });
});
