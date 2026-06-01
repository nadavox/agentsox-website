import { sanitizeArg } from '@agentsox/agent-core';
import { tool } from 'ai';
import { z } from 'zod';

/**
 * FAQ-agent tools. Both are agent-decided.
 *
 * - openIntake: surfaces a CTA card pointing the visitor at the project-intake form
 *   when they're clearly describing a real project (not just curious).
 * - setChips: surfaces 2-4 quick follow-up question chips.
 */
export const faqTools = {
  openIntake: tool({
    description:
      "Surface a CTA card that sends the visitor to send Nadav the details (the contact form that emails him). Call as soon as the visitor wants help with their own situation - even a small signal like naming their business or saying 'can you help me with X'. You do NOT need full project details first. The `reason` is a short headline rendered on the CTA, e.g. 'Tell Nadav about the medspa booking flow you mentioned'.",
    inputSchema: z.object({
      reason: z
        .string()
        .min(1)
        .describe('Short plain-English headline for the CTA card. One concise sentence.'),
    }),
    execute: async ({ reason }) => ({ ok: true, reason: sanitizeArg(reason) }),
  }),
  setChips: tool({
    description:
      'Show 2-4 quick-reply chips with natural follow-up questions the visitor might want to ask. Skip on definitive answers or when an intake CTA has already been surfaced this turn.',
    inputSchema: z.object({
      chips: z.array(z.string()).min(2).max(4),
    }),
    execute: async ({ chips }) => ({ ok: true, chips: sanitizeArg(chips) }),
  }),
};

export type FaqTools = typeof faqTools;
