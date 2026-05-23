import { getLastUserMessage, localPreviewReply } from './bots/agentsox';
import {
  enforceRateLimit,
  errorResponse,
  handleOptions,
  isAllowedOrigin,
  isValidSite,
  jsonResponse,
  readJsonBody,
} from '@agentsox/worker-utils';
import { sanitizeRequestPayload } from './lib/validation';
import { runWorkersAi } from './lib/workersAi';
import type { Env, IntakeRequest } from './types';

const DEFAULT_CONTACT_ENDPOINT = 'https://contact.agentsox.com/api/contact';

async function parseRequest(request: Request): Promise<IntakeRequest> {
  if (!request.headers.get('Content-Type')?.includes('application/json')) {
    throw new Error('Expected application/json');
  }

  return sanitizeRequestPayload(await readJsonBody<IntakeRequest>(request));
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

async function handleContactCompatibility(request: Request, env: Env): Promise<Response> {
  if (!isAllowedOrigin(request, env)) {
    return errorResponse(request, env, 'Origin is not allowed', 403);
  }

  const endpoint = env.CONTACT_ENDPOINT || DEFAULT_CONTACT_ENDPOINT;
  const response = await fetch(endpoint, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
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
      return handleContactCompatibility(request, env);
    }

    return errorResponse(request, env, 'Not found', 404);
  },
} satisfies ExportedHandler<Env>;
