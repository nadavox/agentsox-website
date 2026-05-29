import { sanitizeArg } from '@agentsox/agent-core';
import { tool } from 'ai';
import { z } from 'zod';

/**
 * Optional tools the model may invoke. All three are agent-decided - the model
 * decides every turn whether to call each one. Outputs are sanitized via
 * sanitizeArg so the client never sees em-dashes / smart quotes / ellipsis.
 *
 * - updateSnapshot: persists new structured facts the visitor shared this turn
 * - setChips: surfaces 2-5 quick-reply options for the visitor to pick
 * - markReadyToContact: flips the form-ready signal once snapshot is rich enough
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

export const intakeTools = {
  updateSnapshot: tool({
    description:
      'Persist concrete facts the visitor JUST shared this turn (challenge, businessType, desiredOutcome, currentProcess, currentTools, etc.). Call when - and only when - the visitor stated something that fills at least one field. Skip on greetings, acknowledgements, or thin replies. Never restate prior context; only include fields heard this turn. Never invent.',
    inputSchema: snapshotSchema,
    execute: async (snapshot) => ({ ok: true, ...sanitizeArg(snapshot) }),
  }),
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
