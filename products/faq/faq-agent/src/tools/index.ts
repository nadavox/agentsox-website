import { sanitizeArg } from '@agentsox/agent-core';
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { chipsEnabled, handoffActive, type FaqClientConfig } from '../config';

/**
 * Build the tenant's tool set. The tool NAMES and payload shapes are a fixed wire
 * contract the frontend reads (`openIntake` -> { reason }, `setChips` -> { chips }),
 * so they never change per tenant - only their descriptions and whether they're
 * present at all:
 *
 * - openIntake: the contact handoff CTA. Present only when the tenant has an
 *   enabled handoff; its description is built from the tenant's handoff wording.
 * - setChips: 2-4 quick follow-up chips. Present unless the tenant disables chips.
 */
export function buildFaqTools(config: FaqClientConfig): ToolSet {
  const tools: ToolSet = {};

  if (handoffActive(config)) {
    const { actionPhrase, ctaExample } = config.handoff!;
    tools.openIntake = tool({
      description: `Surface a CTA card that invites the visitor to ${actionPhrase}. Call as soon as the visitor wants help with their own situation - even a small signal like naming their business or saying 'can you help me with X'. You do NOT need full project details first. The \`reason\` is a short plain-English headline rendered on the CTA, e.g. '${ctaExample}'.`,
      inputSchema: z.object({
        reason: z
          .string()
          .min(1)
          .describe('Short plain-English headline for the CTA card. One concise sentence.'),
      }),
      execute: async ({ reason }) => ({ ok: true, reason: sanitizeArg(reason) }),
    });
  }

  if (chipsEnabled(config)) {
    tools.setChips = tool({
      description:
        'Show 2-4 quick-reply chips with natural follow-up questions the visitor might want to ask. Skip on definitive answers or when a handoff CTA has already been surfaced this turn.',
      inputSchema: z.object({
        chips: z.array(z.string()).min(2).max(4),
      }),
      execute: async ({ chips }) => ({ ok: true, chips: sanitizeArg(chips) }),
    });
  }

  return tools;
}

export type FaqTools = ReturnType<typeof buildFaqTools>;
