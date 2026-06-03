import type { UIMessage } from 'ai';

/**
 * Hard caps on a public chat request. The body is already size-capped upstream by
 * `readJsonBody` (413); these bound the *shape* so a crafted body can't blow up the
 * model context or smuggle in instructions.
 */
const MAX_MESSAGES = 40;
const MAX_TEXT_LENGTH = 4_000;

// Part types we accept on a replayed ASSISTANT message. The frontend persists prior
// assistant turns verbatim - including the openIntake / setChips tool parts - and
// sends them back, so those must round-trip. Anything else is rejected.
const ASSISTANT_PART_TYPES = new Set(['text', 'reasoning', 'step-start']);

export interface ValidChatBody {
  /** The client id. On the wire the frontend sends it as `siteId` (kept for compat). */
  clientId: string;
  messages: UIMessage[];
}

export interface ChatBodyError {
  status: number;
  message: string;
}

export type ChatBodyResult = { value: ValidChatBody } | { error: ChatBodyError };

const bad = (message: string, status = 400): ChatBodyResult => ({ error: { status, message } });

/**
 * Validate a public `{ siteId, messages }` chat request. The request comes straight
 * from the browser, so it is untrusted:
 *
 * - roles are restricted to user / assistant - a client can never inject a `system`
 *   or `developer` message to rewrite the agent's instructions.
 * - user messages may only carry text parts - a client can't fake a tool result.
 * - assistant messages may carry text / reasoning / step-start / `tool-*` parts so
 *   genuine prior turns replay (the frontend persists and resends them).
 * - message count and per-part text length are bounded.
 *
 * Returns the narrowed body on success, or `{ error: { status, message } }`.
 */
export function validateChatBody(body: unknown): ChatBodyResult {
  if (!body || typeof body !== 'object') return bad('Invalid JSON request');

  const { siteId, messages } = body as Record<string, unknown>;

  if (typeof siteId !== 'string' || !siteId.trim()) return bad('siteId is required');
  const clientId = siteId;
  if (!Array.isArray(messages) || messages.length === 0) {
    return bad('At least one user message required');
  }
  if (messages.length > MAX_MESSAGES) return bad('Too many messages');

  for (const message of messages) {
    if (!message || typeof message !== 'object') return bad('Malformed message');
    const role = (message as { role?: unknown }).role;
    if (role !== 'user' && role !== 'assistant') return bad('Unsupported message role');

    const parts = (message as { parts?: unknown }).parts;
    if (parts === undefined) continue;
    if (!Array.isArray(parts)) return bad('Malformed message');

    for (const part of parts) {
      if (!part || typeof part !== 'object') return bad('Malformed message content');
      const type = (part as { type?: unknown }).type;
      if (typeof type !== 'string') return bad('Malformed message content');

      if (type === 'text') {
        const text = (part as { text?: unknown }).text;
        if (typeof text !== 'string') return bad('Malformed message content');
        if (text.length > MAX_TEXT_LENGTH) return bad('Message text is too long');
        continue;
      }

      // Non-text parts: users may not send them; assistants may only replay a known set.
      if (role === 'user') return bad('Unsupported message content');
      if (!type.startsWith('tool-') && !ASSISTANT_PART_TYPES.has(type)) {
        return bad('Unsupported message content');
      }
    }
  }

  return { value: { clientId, messages: messages as UIMessage[] } };
}
