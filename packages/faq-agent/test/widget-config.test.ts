import { describe, expect, it } from 'vitest';
import { defineFaqClient, publicWidgetConfig } from '@agentsox/faq-agent';

const client = defineFaqClient({
  id: 'shades',
  identity: {
    brand: 'גווני הנשמה',
    persona: 'SECRET persona that must never reach the browser.',
    voice: ['SECRET voice line.'],
  },
  knowledge: { faq: [{ question: 'SECRET q', answer: 'SECRET answer' }] },
  rules: ['SECRET rule'],
  handoff: {
    enabled: true,
    scope: 'You answer questions about the practice.',
    actionPhrase: 'send a WhatsApp',
    ctaExample: 'Send a WhatsApp about a reading',
    url: 'https://wa.me/972500000000',
  },
  widget: { locale: 'he', rtl: true, title: 'גווני הנשמה', theme: { primary: '#6b21a8' } },
  origins: ['https://theshadesofsoul.com'],
});

describe('publicWidgetConfig', () => {
  const pub = publicWidgetConfig(client);
  const serialized = JSON.stringify(pub);

  it('exposes only look + locale + handoff CTA', () => {
    expect(pub).toMatchObject({
      id: 'shades',
      title: 'גווני הנשמה',
      locale: 'he',
      rtl: true,
      position: 'right',
      chips: true,
      theme: { primary: '#6b21a8' },
      handoff: { actionPhrase: 'send a WhatsApp', url: 'https://wa.me/972500000000' },
    });
  });

  it('NEVER leaks the knowledge base, persona, voice, or rules', () => {
    expect(serialized).not.toContain('SECRET');
    expect(pub).not.toHaveProperty('knowledge');
    expect(pub).not.toHaveProperty('identity');
    expect(pub).not.toHaveProperty('rules');
    expect(pub).not.toHaveProperty('origins');
  });

  it('omits handoff when the client has none', () => {
    const noHandoff = defineFaqClient({
      id: 'x',
      identity: { brand: 'X', persona: 'p', voice: ['v'] },
      knowledge: { faq: [{ question: 'q', answer: 'a' }] },
      origins: ['https://x.test'],
    });
    expect(publicWidgetConfig(noHandoff).handoff).toBeUndefined();
    expect(publicWidgetConfig(noHandoff).locale).toBe('en'); // default
  });
});
