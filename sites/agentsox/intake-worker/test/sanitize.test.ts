import { describe, expect, it } from 'vitest';
import { applyReplacements, sanitizeArg } from '@agentsox/intake-agent';

describe('applyReplacements', () => {
  it('replaces em-dash surrounded by optional spaces with " - "', () => {
    expect(applyReplacements('pattern — the DMs pile up')).toBe('pattern - the DMs pile up');
    expect(applyReplacements('pattern—tight')).toBe('pattern - tight');
    expect(applyReplacements('one — two — three')).toBe('one - two - three');
  });

  it('replaces en-dash the same way', () => {
    expect(applyReplacements('pages 12–14')).toBe('pages 12 - 14');
  });

  it('replaces smart double quotes with straight quotes', () => {
    expect(applyReplacements('“where is my order” tickets')).toBe('"where is my order" tickets');
  });

  it('replaces smart single quotes (apostrophes) with straight quotes', () => {
    expect(applyReplacements('that’s a classic')).toBe("that's a classic");
    expect(applyReplacements("‘edge’ case")).toBe("'edge' case");
  });

  it('replaces ellipsis character with three dots', () => {
    expect(applyReplacements('thinking…')).toBe('thinking...');
  });

  it('leaves plain ASCII text untouched', () => {
    const input = "We sell on Shopify and Zendesk - it's a classic pattern.";
    expect(applyReplacements(input)).toBe(input);
  });

  it('handles a mixed string with several typographic chars in one pass', () => {
    expect(applyReplacements('“It’s broken” — really…')).toBe(`"It's broken" - really...`);
  });
});

describe('sanitizeArg', () => {
  it('passes through non-string scalars untouched', () => {
    expect(sanitizeArg(42)).toBe(42);
    expect(sanitizeArg(true)).toBe(true);
    expect(sanitizeArg(null)).toBe(null);
    expect(sanitizeArg(undefined)).toBe(undefined);
  });

  it('sanitizes a top-level string', () => {
    expect(sanitizeArg('hi — there')).toBe('hi - there');
  });

  it('sanitizes every string in an array', () => {
    expect(sanitizeArg(['hi — there', "that’s fine", 7])).toEqual(['hi - there', "that's fine", 7]);
  });

  it('sanitizes nested object string values', () => {
    const input = {
      challenge: 'Tons of DMs — can’t keep up',
      businessType: 'medspa',
      unknowns: ['Tools — none yet'],
      count: 3,
      nested: { summary: 'It’s “urgent”…' },
    };

    expect(sanitizeArg(input)).toEqual({
      challenge: "Tons of DMs - can't keep up",
      businessType: 'medspa',
      unknowns: ['Tools - none yet'],
      count: 3,
      nested: { summary: `It's "urgent"...` },
    });
  });

  it('does not mutate the input object', () => {
    const input = { challenge: 'Foo — bar' };
    const result = sanitizeArg(input);
    expect(input.challenge).toBe('Foo — bar');
    expect(result.challenge).toBe('Foo - bar');
  });
});
