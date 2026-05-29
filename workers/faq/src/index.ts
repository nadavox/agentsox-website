import {
  errorResponse,
  handleOptions,
  jsonResponse,
} from '@agentsox/worker-utils';
import { handleStreamingChat } from './lib/streamingChat';
import type { Env } from './types';

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return handleOptions(request, env);
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonResponse(request, env, { ok: true, service: 'agentsox-faq-worker' });
    }

    if (request.method === 'POST' && url.pathname === '/api/chat') {
      return handleStreamingChat(request, env);
    }

    return errorResponse(request, env, 'Not found', 404);
  },
} satisfies ExportedHandler<Env>;
