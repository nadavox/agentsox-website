import { describe, expect, it } from 'vitest';
import { defineFaqClient, defineFaqClientRegistry } from '@agentsox/faq-agent';

const validInput = {
  id: 'acme',
  identity: { brand: 'Acme', persona: 'Acme builds widgets.', voice: ['Be brief.'] },
  knowledge: { faq: [{ question: 'What is Acme?', answer: 'A widget shop.' }] },
  origins: ['https://acme.test'],
};

describe('defineFaqClient', () => {
  it('accepts a valid config and applies defaults', () => {
    const client = defineFaqClient(validInput);
    expect(client.id).toBe('acme');
    expect(client.behavior?.chips ?? true).toBe(true);
  });

  it('records the optional account link back to the workspace', () => {
    const client = defineFaqClient({
      ...validInput,
      account: { email: 'hi@acme.com', name: 'Acme' },
    });
    expect(client.account?.email).toBe('hi@acme.com');
    expect(client.account?.name).toBe('Acme');
  });

  it('works without an account (it is optional)', () => {
    expect(defineFaqClient(validInput).account).toBeUndefined();
  });

  it('stamps the current schema version by default', () => {
    expect(defineFaqClient(validInput).schemaVersion).toBe(1);
  });

  it('rejects a config with no FAQ entries', () => {
    expect(() =>
      defineFaqClient({ ...validInput, knowledge: { faq: [] } }),
    ).toThrow();
  });

  it('rejects a config missing a brand', () => {
    expect(() =>
      defineFaqClient({
        ...validInput,
        identity: { brand: '', persona: 'x', voice: ['y'] },
      }),
    ).toThrow();
  });

  it('rejects a config with no origins (a tenant can never ship without one)', () => {
    expect(() => defineFaqClient({ ...validInput, origins: [] })).toThrow();
  });
});

describe('defineFaqClientRegistry', () => {
  it('keys each client by its own id', () => {
    const a = defineFaqClient(validInput);
    const b = defineFaqClient({ ...validInput, id: 'beta', origins: ['https://beta.test'] });
    const registry = defineFaqClientRegistry([a, b]);
    expect(Object.keys(registry).sort()).toEqual(['acme', 'beta']);
    expect(registry.acme).toBe(a);
  });

  it('throws on a duplicate id (key can never drift from config)', () => {
    const a = defineFaqClient(validInput);
    const dupe = defineFaqClient(validInput);
    expect(() => defineFaqClientRegistry([a, dupe])).toThrow(/duplicate client id/);
  });
});
