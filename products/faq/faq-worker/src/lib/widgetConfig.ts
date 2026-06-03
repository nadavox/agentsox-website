import { publicWidgetConfig, type FaqClientConfig } from '@agentsox/faq-agent';
import { errorResponse, isAllowedOrigin, jsonResponse } from '@agentsox/worker-utils';
import { FAQ_CLIENTS } from '../clients';
import type { Env } from '../types';
import { buildCorsEnv, requestOriginAllowed } from './cors';

export interface WidgetConfigDeps {
  registry?: Record<string, FaqClientConfig>;
}

/**
 * `GET /api/widget-config?siteId=` - the public look/locale/handoff the embeddable
 * widget needs, by siteId. Same CORS + per-client origin binding as the chat
 * endpoint; returns ONLY `publicWidgetConfig` (never the knowledge base).
 */
export async function handleWidgetConfig(
  request: Request,
  env: Env,
  deps: WidgetConfigDeps = {},
): Promise<Response> {
  const registry = deps.registry ?? FAQ_CLIENTS;
  const corsEnv = buildCorsEnv(request, registry, env);

  if (!isAllowedOrigin(request, corsEnv)) {
    return errorResponse(request, corsEnv, 'Origin is not allowed', 403);
  }

  const siteId = new URL(request.url).searchParams.get('siteId') ?? '';
  const client = registry[siteId];
  if (!client) {
    return errorResponse(request, corsEnv, 'Unknown siteId', 403);
  }

  if (!requestOriginAllowed(request, client, env.ENVIRONMENT)) {
    return errorResponse(request, corsEnv, 'Origin is not allowed for this client', 403);
  }

  return jsonResponse(request, corsEnv, publicWidgetConfig(client), {
    headers: { 'Cache-Control': 'public, max-age=300' },
  });
}
