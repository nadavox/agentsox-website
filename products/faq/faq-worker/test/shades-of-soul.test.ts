import { buildFaqSystemPrompt, publicWidgetConfig } from '@agentsox/faq-agent';
import { describe, expect, it } from 'vitest';
import { FAQ_CLIENTS } from '../src/clients';
import { shadesOfSoulFaqClient } from '../src/clients/shades-of-soul';

describe('shades-of-soul client (Hebrew, RTL, WhatsApp)', () => {
  it('is registered under its siteId', () => {
    expect(FAQ_CLIENTS['shades-of-soul']).toBe(shadesOfSoulFaqClient);
  });

  it('renders a Hebrew prompt in her brand, with no AgentsOX leakage', () => {
    const prompt = buildFaqSystemPrompt(shadesOfSoulFaqClient);
    expect(prompt).toContain('גווני הנשמה');
    expect(prompt).toContain('נומרולוגיה');
    expect(prompt).toContain('לשלוח הודעה לרומי בוואטסאפ'); // her handoff phrase
    expect(prompt).not.toContain('AgentsOX');
    expect(prompt).not.toContain('Nadav');
  });

  it('exposes a Hebrew/RTL widget config with the WhatsApp CTA and no knowledge', () => {
    const pub = publicWidgetConfig(shadesOfSoulFaqClient);
    expect(pub).toMatchObject({
      id: 'shades-of-soul',
      locale: 'he',
      rtl: true,
      handoff: { actionPhrase: 'לשלוח הודעה לרומי בוואטסאפ' },
    });
    expect(pub.handoff?.url).toMatch(/^https:\/\/wa\.me\//);
    expect(JSON.stringify(pub)).not.toContain('נומרולוגיה היא קריאה'); // FAQ answer text never shipped
  });
});
