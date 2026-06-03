import {
  errorResponse,
  handleOptions,
  isAllowedOrigin,
  jsonResponse,
} from '@agentsox/worker-utils';
import { handleStreamingChat } from './lib/streamingChat';
import type { Env } from './types';

const DEFAULT_CONTACT_ENDPOINT = 'https://contact.agentsox.com/api/contact';

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
      return handleStreamingChat(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/api/contact') {
      return handleContactCompatibility(request, env);
    }

    return errorResponse(request, env, 'Not found', 404);
  },
} satisfies ExportedHandler<Env>;
