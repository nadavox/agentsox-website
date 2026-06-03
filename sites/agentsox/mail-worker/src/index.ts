import {
  enforceRateLimit,
  errorResponse,
  handleOptions,
  isAllowedOrigin,
  isValidSite,
  jsonResponse,
  readJsonBody,
} from '@agentsox/worker-utils';
import { logContactAttempt, sendContactEmail } from './lib/email';
import { sanitizeContactPayload, validateContactPayload } from './lib/validation';
import type { ContactRequest } from '@agentsox/contracts';
import type { Env } from './types';

function contactRequestId(): string {
  return crypto.randomUUID();
}

async function parseContactRequest(request: Request): Promise<ContactRequest> {
  if (!request.headers.get('Content-Type')?.includes('application/json')) {
    throw new Error('Expected application/json');
  }

  return sanitizeContactPayload(await readJsonBody<ContactRequest>(request));
}

async function handleContact(request: Request, env: Env): Promise<Response> {
  let payload: ContactRequest;
  const requestId = contactRequestId();

  if (!isAllowedOrigin(request, env)) {
    return errorResponse(request, env, 'Origin is not allowed', 403);
  }

  const rateLimitResponse = await enforceRateLimit(request, env);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    payload = await parseContactRequest(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON request';
    const knownMessages = new Set([
      'Expected application/json',
      'Request body is too large',
    ]);
    return errorResponse(
      request,
      env,
      knownMessages.has(message) ? message : 'Invalid JSON request',
      message === 'Request body is too large' ? 413 : 400,
    );
  }

  if (!isValidSite(env, payload.siteId)) {
    return errorResponse(request, env, 'Unknown siteId', 403);
  }

  const validationError = validateContactPayload(payload);
  if (validationError) {
    return errorResponse(request, env, validationError, 400);
  }

  logContactAttempt('received', request, payload, requestId);

  try {
    const result = await sendContactEmail(env, payload, requestId);
    logContactAttempt('sent', request, payload, requestId, {
      messageId: result.messageId,
      to: env.CONTACT_TO_EMAIL || 'nadav@agentsox.com',
    });

    return jsonResponse(request, env, {
      ok: true,
      requestId,
      messageId: result.messageId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email delivery failed';
    logContactAttempt('failed', request, payload, requestId, { error: message });
    return errorResponse(request, env, 'Could not send message right now', 502);
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return handleOptions(request, env);
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonResponse(request, env, { ok: true, service: 'agentsox-mail-worker' });
    }

    if (request.method === 'POST' && url.pathname === '/api/contact') {
      return handleContact(request, env);
    }

    return errorResponse(request, env, 'Not found', 404);
  },
} satisfies ExportedHandler<Env>;
