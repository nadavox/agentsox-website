import { tool } from 'ai';
import { z } from 'zod';
import { sanitizeArg } from '../sanitize';

/**
 * Snapshot extraction lives in `output: Output.object({ snapshotSchema })` on a
 * generateObject pass after the prose stream finishes. That's a guaranteed
 * deterministic step, not an optional tool.
 *
 * These are the OPTIONAL tools the model may invoke when it makes UX sense:
 * - setChips: surfaces 2-5 quick-reply options for the visitor to pick
 * - markReadyToContact: flips the form-ready signal once snapshot is rich enough
 *
 * Both sanitize their output via sanitizeArg so the client never sees em-dashes /
 * smart quotes / ellipsis even if the model emitted them.
 */
export const intakeTools = {
  setChips: tool({
    description:
      'Show quick-reply chips below this turn. Use ONLY when there are 3-5 distinct concrete options the visitor might pick. Skip on open-ended turns.',
    inputSchema: z.object({
      chips: z.array(z.string()).min(2).max(5),
    }),
    execute: async ({ chips }) => ({ ok: true, chips: sanitizeArg(chips) }),
  }),
  markReadyToContact: tool({
    description:
      'Signal that the conversation has enough signal (clear problem + desired outcome) to send to the contact form. Provide a concise plain-English summary the visitor will see pre-filled.',
    inputSchema: z.object({
      summary: z.string().describe('Short plain-English project summary for the contact form.'),
    }),
    execute: async ({ summary }) => ({ ok: true, summary: sanitizeArg(summary) }),
  }),
};

export type IntakeTools = typeof intakeTools;

/**
 * The project snapshot schema used as the structured output of the post-prose
 * extraction pass. Guaranteed to fire every turn - the model can't skip a
 * generateObject call the way it can skip an optional tool.
 */
export const snapshotSchema = z.object({
  challenge: z.string().min(1).optional().describe(
    'The business problem or result the visitor wants. The CORE pain in their words.',
  ),
  businessType: z.string().min(1).optional().describe(
    'The kind of business (medspa, real estate, e-commerce, coach, etc.).',
  ),
  currentProcess: z.string().min(1).optional().describe(
    'How things work today, plainly described. Skip if the visitor only stated a problem without describing process.',
  ),
  currentTools: z.string().min(1).optional().describe(
    'Tools, channels, or systems mentioned (e.g. Shopify + Zendesk, WhatsApp, Instagram DMs).',
  ),
  desiredOutcome: z.string().min(1).optional().describe(
    'What success would look like. Skip if the visitor has not yet stated a desired outcome.',
  ),
  opportunity: z.string().min(1).optional().describe(
    'Your concise interpretation of the project opportunity. Skip if too early to summarize.',
  ),
  suggestedFirstStep: z.string().min(1).optional().describe(
    'A practical first step AgentsOX could discuss. Skip until problem + outcome are clear.',
  ),
});

export type Snapshot = z.infer<typeof snapshotSchema>;
