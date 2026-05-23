import type { ChatMessage, ContactRequest, IntakeContext, IntakeRequest } from '../types';

const MAX_CONTENT_LENGTH_BYTES = 12_000;
const MAX_MESSAGE_COUNT = 12;
const MAX_MESSAGE_CHARS = 1200;
const MAX_CONTEXT_CHARS = 1200;
const MAX_CONTACT_NAME_CHARS = 120;
const MAX_CONTACT_EMAIL_CHARS = 254;
const MAX_CONTACT_MESSAGE_CHARS = 4_000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned ? cleaned.slice(0, maxLength) : undefined;
}

function cleanMultilineText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim();
  return cleaned ? cleaned.slice(0, maxLength) : undefined;
}

export function assertRequestSize(request: Request): void {
  const contentLength = Number(request.headers.get('Content-Length') || '0');
  if (contentLength > MAX_CONTENT_LENGTH_BYTES) {
    throw new Error('Request body is too large');
  }
}

export async function readJsonBody<T>(request: Request): Promise<T> {
  assertRequestSize(request);

  if (!request.body) {
    throw new Error('Invalid JSON request');
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalBytes += value.byteLength;
      if (totalBytes > MAX_CONTENT_LENGTH_BYTES) {
        await reader.cancel();
        throw new Error('Request body is too large');
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const text = new TextDecoder().decode(bytes).trim();
    if (!text) throw new Error('Invalid JSON request');
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Invalid JSON request');
  }
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

export function sanitizeContactPayload(payload: ContactRequest): ContactRequest {
  return {
    siteId: cleanText(payload.siteId, 120),
    name: cleanText(payload.name, MAX_CONTACT_NAME_CHARS),
    email: cleanText(payload.email, MAX_CONTACT_EMAIL_CHARS)?.toLowerCase(),
    message: cleanMultilineText(payload.message, MAX_CONTACT_MESSAGE_CHARS),
    source: cleanText(payload.source, 120),
  };
}

export function validateContactPayload(payload: ContactRequest): string | null {
  if (!payload.name || payload.name.length < 2) {
    return 'Name must be at least 2 characters';
  }

  if (!payload.email || !EMAIL_PATTERN.test(payload.email)) {
    return 'A valid email is required';
  }

  if (!payload.message || payload.message.length < 10) {
    return 'Message must be at least 10 characters';
  }

  return null;
}
