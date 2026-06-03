import { createFaqAgent, type FaqClientConfig } from '@agentsox/faq-agent';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { LanguageModel } from 'ai';
import {
  corsHeaders,
  enforceRateLimit,
  errorResponse,
  isAllowedOrigin,
  readJsonBody,
} from '@agentsox/worker-utils';
import { FAQ_CLIENTS } from '../clients';
import type { Env } from '../types';
import { buildCorsEnv, requestOriginAllowed } from './cors';
import { enforceQuotas } from './quota';
import { validateChatBody } from './validateChatBody';

const DEFAULT_MODEL = 'deepseek/deepseek-v4-flash';

/**
 * Injectable seams so the handler can be tested without the real registry or a live
 * model. Production passes nothing and gets the real FAQ_CLIENTS + OpenRouter.
 */
export interface StreamingChatDeps {
  registry?: Record<string, FaqClientConfig>;
  createModel?: (apiKey: string, modelId: string) => LanguageModel;
}

/**
 * Multi-client Cloudflare Worker transport for the FAQ agent. Resolves the client
 * from `siteId`, enforces per-client origin binding + rate limiting, validates the
 * untrusted request body, then hands off to `@agentsox/faq-agent` and merges CORS
 * headers into the streaming Response.
 *
 * The CORS allowlist is derived from the client registry (single source of truth),
 * so onboarding a client never touches an env var.
 */
export async function handleStreamingChat(
  request: Request,
  env: Env,
  deps: StreamingChatDeps = {},
): Promise<Response> {
  const registry = deps.registry ?? FAQ_CLIENTS;
  const createModel =
    deps.createModel ?? ((apiKey, modelId) => createOpenRouter({ apiKey })(modelId));

  const corsEnv = buildCorsEnv(request, registry, env);

  // Coarse CORS baseline: origin must be served by SOME client. The per-client
  // binding below is the real isolation; this also gates the response CORS headers.
  if (!isAllowedOrigin(request, corsEnv)) {
    return errorResponse(request, corsEnv, 'Origin is not allowed', 403);
  }

  if (!env.OPENROUTER_API_KEY) {
    return errorResponse(request, corsEnv, 'AI provider not configured', 503);
  }

  let raw: unknown;
  try {
    raw = await readJsonBody<unknown>(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON request';
    return errorResponse(
      request,
      corsEnv,
      message === 'Request body is too large' ? message : 'Invalid JSON request',
      message === 'Request body is too large' ? 413 : 400,
    );
  }

  const parsed = validateChatBody(raw);
  if ('error' in parsed) {
    return errorResponse(request, corsEnv, parsed.error.message, parsed.error.status);
  }
  const { clientId, messages } = parsed.value;

  const client = registry[clientId];
  if (!client) {
    return errorResponse(request, corsEnv, 'Unknown siteId', 403);
  }

  // Per-client origin binding: the request origin must be one THIS client is served
  // from (or the worker's own hosted page), so one client's origin can't drive another.
  if (!requestOriginAllowed(request, client, env.ENVIRONMENT)) {
    return errorResponse(request, corsEnv, 'Origin is not allowed for this client', 403);
  }

  // Per-client rate limit: separate bucket per client (per-minute burst control).
  const rl = await enforceRateLimit(request, corsEnv, clientId);
  if (rl) return rl;

  const modelId = client.ai?.model ?? DEFAULT_MODEL;
  const startedAt = Date.now();

  // Per-visitor quotas (minute + day) + a high per-client/day ceiling. Bounds model
  // cost under sustained / IP-rotating abuse without throttling a busy site's real
  // visitors (limits that touch a user are per-visitor). No-op until KV is bound.
  const quota = await enforceQuotas(env, client, request, new Date());
  if (!quota.ok) {
    logRequest(clientId, modelId, 429, startedAt);
    const message =
      quota.scope === 'visitor-minute'
        ? 'Too many messages - please slow down a moment.'
        : quota.scope === 'visitor-day'
          ? "You've reached today's message limit. Please try again tomorrow."
          : 'The assistant is temporarily unavailable. Please try again later.';
    return errorResponse(request, corsEnv, message, 429);
  }

  let response: Response;
  try {
    const agent = createFaqAgent({
      model: createModel(env.OPENROUTER_API_KEY, modelId),
      client,
      providerOptions: { openrouter: { reasoning: { enabled: false, exclude: true } } },
    });
    response = await agent.respond({ messages });
  } catch (error) {
    logRequest(clientId, modelId, 500, startedAt, error);
    return errorResponse(request, corsEnv, 'The assistant hit an error.', 500);
  }

  logRequest(clientId, modelId, response.status, startedAt);

  const merged = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders(request, corsEnv) as Record<string, string>)) {
    merged.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: merged,
  });
}

/**
 * One structured log line per request. Carries the client, model, status, and
 * latency for cost/leak debugging - never the user's message content.
 */
function logRequest(
  clientId: string,
  model: string,
  status: number,
  startedAt: number,
  error?: unknown,
): void {
  const entry: Record<string, unknown> = {
    tag: '[faq-worker]',
    clientId,
    model,
    status,
    ms: Date.now() - startedAt,
  };
  if (error) entry.error = error instanceof Error ? error.name : 'UnknownError';
  console.log(JSON.stringify(entry));
}
