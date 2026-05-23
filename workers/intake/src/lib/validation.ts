import type { ChatMessage, IntakeContext, IntakeRequest } from '../types';

const MAX_MESSAGE_COUNT = 12;
const MAX_MESSAGE_CHARS = 1200;
const MAX_CONTEXT_CHARS = 1200;

function cleanText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned ? cleaned.slice(0, maxLength) : undefined;
}

export function sanitizeContext(context: unknown): IntakeContext {
  if (!context || typeof context !== 'object') return {};
  const input = context as IntakeContext;

  return {
    problem: cleanText(input.problem, MAX_CONTEXT_CHARS),
    businessType: cleanText(input.businessType, MAX_CONTEXT_CHARS),
    tools: cleanText(input.tools, MAX_CONTEXT_CHARS),
    details: cleanText(input.details, MAX_CONTEXT_CHARS),
    summary: cleanText(input.summary, MAX_CONTEXT_CHARS),
  };
}

export function sanitizeRequestPayload(payload: IntakeRequest): IntakeRequest {
  const rawMessages = Array.isArray(payload.messages) ? payload.messages : [];
  const messages: ChatMessage[] = rawMessages
    .filter((message) => message?.role === 'user' || message?.role === 'assistant')
    .map((message) => ({
      role: message.role,
      content: cleanText(message.content, MAX_MESSAGE_CHARS) || '',
    }))
    .filter((message) => message.content)
    .slice(-MAX_MESSAGE_COUNT);

  return {
    siteId: cleanText(payload.siteId, 120),
    context: sanitizeContext(payload.context),
    messages,
  };
}
