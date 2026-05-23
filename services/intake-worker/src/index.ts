import { getLastUserMessage, localPreviewReply } from './bots/agentsox';
import { handleOptions, isAllowedOrigin } from './lib/cors';
import { errorResponse, jsonResponse } from './lib/http';
import { logContactAttempt, sendContactEmail } from './lib/resend';
import {
  readJsonBody,
  sanitizeContactPayload,
  sanitizeRequestPayload,
  validateContactPayload,
} from './lib/validation';
import { runWorkersAi } from './lib/workersAi';
import type { ContactRequest, Env, IntakeRequest } from './types';

function isValidSite(env: Env, siteId?: string): boolean {
  return Boolean(siteId) && (!env.SITE_ID || siteId === env.SITE_ID);
}

async function parseRequest(request: Request): Promise<IntakeRequest> {
  if (!request.headers.get('Content-Type')?.includes('application/json')) {
    throw new Error('Expected application/json');
  }

  return sanitizeRequestPayload(await readJsonBody<IntakeRequest>(request));
}

async function parseContactRequest(request: Request): Promise<ContactRequest> {
  if (!request.headers.get('Content-Type')?.includes('application/json')) {
    throw new Error('Expected application/json');
  }

  return sanitizeContactPayload(await readJsonBody<ContactRequest>(request));
}

function getRateLimitKey(request: Request): string {
  const ip =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown-ip';
  const origin = request.headers.get('Origin') || 'no-origin';
  return `${origin}:${ip}`.slice(0, 256);
}

function contactRequestId(): string {
  return crypto.randomUUID();
}

async function enforceRateLimit(request: Request, env: Env): Promise<Response | null> {
  if (!env.API_RATE_LIMITER) return null;

  const { success } = await env.API_RATE_LIMITER.limit({ key: getRateLimitKey(request) });
  if (success) return null;

  return errorResponse(request, env, 'Too many requests. Please wait and try again.', 429);
}

async function handleChat(request: Request, env: Env): Promise<Response> {
  let payload: IntakeRequest;

  if (!isAllowedOrigin(request, env)) {
    return errorResponse(request, env, 'Origin is not allowed', 403);
  }

  const rateLimitResponse = await enforceRateLimit(request, env);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    payload = await parseRequest(request);
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

  const context = payload.context || {};
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const lastUserMessage = getLastUserMessage(messages);

  if (!lastUserMessage) {
    return errorResponse(request, env, 'At least one user message is required', 400);
  }

  try {
    const provider = env.MODEL_PROVIDER || 'workers-ai';
    const data =
      provider === 'local-preview'
        ? localPreviewReply(lastUserMessage, context)
        : await runWorkersAi(env, messages, context);

    return jsonResponse(request, env, data);
  } catch (error) {
    console.error('intake_worker_error', error);
    return jsonResponse(
      request,
      env,
      localPreviewReply(lastUserMessage, context),
      { status: 200 },
    );
  }
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
      return jsonResponse(request, env, { ok: true, service: 'agentsox-intake-worker' });
    }

    if (request.method === 'POST' && url.pathname === '/api/chat') {
      return handleChat(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/api/contact') {
      return handleContact(request, env);
    }

    return errorResponse(request, env, 'Not found', 404);
  },
} satisfies ExportedHandler<Env>;
