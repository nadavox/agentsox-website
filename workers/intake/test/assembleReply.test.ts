import { describe, expect, it } from 'vitest';
import { assembleReply } from '@agentsox/intake-agent';

/**
 * Regression tests for the cross-step reply de-duplication. The model (DeepSeek)
 * emits its reply across steps and sometimes re-emits the trailing sentence with a
 * word changed or its punctuation dropped, which the old exact-containment dedup
 * missed - producing doubled questions / run-ons. The strings below are taken from
 * real captured failures (medspa intake, long rambling input).
 */
describe('assembleReply - cross-step repetition', () => {
  it('collapses an exact whole-message repeat across steps', () => {
    const full =
      "That's a full morning of manual admin. What booking system are you using?";
    expect(assembleReply([full, '', full])).toBe(full);
  });

  it('drops a trailing question re-emitted verbatim in a later step', () => {
    const step1 =
      "That's a solid two hours of your day gone.\n\nWhat does success look like for you - is it getting those two hours back, or making sure more clients rebook?\n\n";
    const step3 =
      'What does success look like for you - is it getting those two hours back, or making sure more clients rebook?';
    const out = assembleReply([step1, '', step3]);
    expect(out).toContain('What does success look like for you');
    // Only one occurrence of the question survives.
    expect(out.match(/What does success look like for you/g)).toHaveLength(1);
  });

  it('collapses a run-on where the trailing question restarts itself', () => {
    // step1 prose was cut at "...using now" (no "?"), step2 re-emitted the full
    // question; joined they become a run-on the exact-match dedup let through.
    const step1 =
      "We'd wire those pieces together so it runs itself.\n\nWhat booking system are you using now";
    const step2 = 'What booking system are you using?';
    const out = assembleReply([step1, step2]);
    expect(out.match(/What booking system are you using/g)).toHaveLength(1);
    expect(out).not.toMatch(/using now What booking system/);
  });

  it('collapses a run-on where both copies carry the trailing word', () => {
    const out = assembleReply([
      'What booking system are you using now What booking system are you using now?',
    ]);
    expect(out).toBe('What booking system are you using now?');
  });

  it('drops a doubled punctuated question but keeps the following sentence', () => {
    const out = assembleReply([
      'What booking system are you using? What booking system are you using? Knowing that tells us how we would plug into it.',
    ]);
    expect(out.match(/What booking system are you using\?/g)).toHaveLength(1);
    expect(out).toContain('Knowing that tells us how we would plug into it.');
  });

  it('keeps a genuine acknowledgement + question split (no false collapse)', () => {
    const out = assembleReply([
      "That's a brutal way to start the day.",
      'What booking system are you using?',
    ]);
    expect(out).toBe(
      "That's a brutal way to start the day. What booking system are you using?",
    );
  });

  it('does not collapse two distinct sentences that share a few words', () => {
    const text =
      'We build dashboards. We build dashboards that update live so you stop guessing from spreadsheets.';
    expect(assembleReply([text])).toBe(text);
  });

  it('preserves the blank-line paragraph break in a clean reply', () => {
    const text =
      "That's the classic medspa admin loop.\n\nWhat would success look like - two hours back, or fewer no-shows?";
    expect(assembleReply([text])).toBe(text);
  });
});
