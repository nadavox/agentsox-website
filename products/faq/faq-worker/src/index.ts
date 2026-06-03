import {
  errorResponse,
  handleOptions,
  jsonResponse,
} from '@agentsox/worker-utils';
import { FAQ_CLIENTS } from './clients';
import { buildCorsEnv } from './lib/cors';
import { handleHostedPage } from './lib/hostedPage';
import { handleStreamingChat } from './lib/streamingChat';
import { handleWidgetConfig } from './lib/widgetConfig';
import type { Env } from './types';

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    // CORS allowlist derived from the client registry (single source of truth). Used
    // for preflight, health, and 404; the chat handler derives the same internally.
    const corsEnv = buildCorsEnv(request, FAQ_CLIENTS, env);

    if (request.method === 'OPTIONS') {
      return handleOptions(request, corsEnv);
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonResponse(request, corsEnv, { ok: true, service: 'agentsox-faq-worker' });
    }

    if (request.method === 'POST' && url.pathname === '/api/chat') {
      return handleStreamingChat(request, env);
    }

    if (request.method === 'GET' && url.pathname === '/api/widget-config') {
      return handleWidgetConfig(request, env);
    }

    if (request.method === 'GET' && url.pathname.startsWith('/c/')) {
      return handleHostedPage(request, env);
    }

    return errorResponse(request, corsEnv, 'Not found', 404);
  },
} satisfies ExportedHandler<Env>;
