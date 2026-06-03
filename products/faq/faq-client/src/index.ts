import { DefaultChatTransport, type UIMessage } from 'ai';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The FAQ chat WIRE CONTRACT, shared by every frontend that talks to the faq-worker
 * (the AgentsOX site's React widget AND the embeddable widget). One source of truth
 * for: the request body shape, the tool names the agent emits, and how to read tool
 * parts back out of the streamed UIMessages. Keep this framework-agnostic (no React)
 * so any client can consume it.
 */

/** Tool names the agent emits as `tool-<name>` parts; the frontend reads these. */
export const FAQ_TOOLS = { intake: 'openIntake', chips: 'setChips' } as const;

export type FaqChips = Record<string, string[]>;
export type FaqCtas = Record<string, { reason: string }>;

function getToolPartName(part: any): string | null {
  if (!part || typeof part.type !== 'string') return null;
  return part.type.startsWith('tool-') ? part.type.slice('tool-'.length) : null;
}

/**
 * Join distinct text parts with a space. The model can emit prose across steps,
 * arriving as separate text parts; joining with '' smashes them together.
 */
export function messageText(message: UIMessage): string {
  return (message.parts || [])
    .filter((p: any) => p.type === 'text')
    .map((p: any) => (p.text || '').trim())
    .filter(Boolean)
    .join(' ');
}

/**
 * Pull NEW setChips / openIntake updates out of assistant tool parts. `processed`
 * is a Set of "<messageId>:<partIndex>" keys already handled; this mutates it so
 * repeated calls are incremental and idempotent. Returns only the fresh updates to
 * merge into per-message chips / CTA state.
 */
export function extractToolUpdates(
  messages: UIMessage[],
  processed: Set<string>,
): { chips: FaqChips; ctas: FaqCtas } {
  const chips: FaqChips = {};
  const ctas: FaqCtas = {};

  for (const message of messages) {
    if (message.role !== 'assistant' || !Array.isArray(message.parts)) continue;
    message.parts.forEach((part: any, i: number) => {
      const toolName = getToolPartName(part);
      if (!toolName) return;
      if (part.state !== 'output-available' && part.state !== 'input-available') return;
      const key = `${message.id}:${i}`;
      if (processed.has(key)) return;
      processed.add(key);
      const data = part.state === 'output-available' && part.output ? part.output : part.input || {};
      if (toolName === FAQ_TOOLS.chips && Array.isArray(data.chips)) {
        chips[message.id] = data.chips.filter((c: any) => typeof c === 'string' && c.trim());
      } else if (toolName === FAQ_TOOLS.intake && typeof data.reason === 'string' && data.reason.trim()) {
        ctas[message.id] = { reason: data.reason.trim() };
      }
    });
  }

  return { chips, ctas };
}

/** Transport that posts `{ siteId, messages }` to the FAQ chat endpoint. */
export function createFaqTransport({ endpoint, siteId }: { endpoint: string; siteId: string }) {
  return new DefaultChatTransport({
    api: endpoint,
    prepareSendMessagesRequest: ({ messages }: { messages: UIMessage[] }) => ({
      body: { siteId, messages },
    }),
  });
}
