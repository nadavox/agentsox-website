import type { ContactRequest } from '@agentsox/contracts';

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
