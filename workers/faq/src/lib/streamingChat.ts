import { createFaqAgent } from '@agentsox/faq-agent';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { UIMessage } from 'ai';
import {
  corsHeaders,
  enforceRateLimit,
  errorResponse,
  isAllowedOrigin,
  isValidSite,
  readJsonBody,
} from '@agentsox/worker-utils';
import type { Env } from '../types';

const MODEL = 'deepseek/deepseek-v4-flash';

interface ChatBody {
  siteId?: string;
  messages?: UIMessage[];
}

/**
 * Cloudflare Worker transport for the FAQ agent. Validates the request,
 * picks the model, hands off to `@agentsox/faq-agent`, and merges CORS
 * headers into the streaming Response.
 */
export async function handleStreamingChat(request: Request, env: Env): Promise<Response> {
  if (!isAllowedOrigin(request, env)) {
    return errorResponse(request, env, 'Origin is not allowed', 403);
  }

  const rl = await enforceRateLimit(request, env);
  if (rl) return rl;

  if (!env.OPENROUTER_API_KEY) {
    return errorResponse(request, env, 'AI provider not configured', 503);
  }

  let body: ChatBody;
  try {
    body = await readJsonBody<ChatBody>(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON request';
    const known = new Set(['Expected application/json', 'Request body is too large']);
    return errorResponse(
      request,
      env,
      known.has(message) ? message : 'Invalid JSON request',
      message === 'Request body is too large' ? 413 : 400,
    );
  }

  if (!isValidSite(env, body.siteId)) {
    return errorResponse(request, env, 'Unknown siteId', 403);
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length) {
    return errorResponse(request, env, 'At least one user message required', 400);
  }

  const openrouter = createOpenRouter({ apiKey: env.OPENROUTER_API_KEY });

  const agent = createFaqAgent({
    model: openrouter(MODEL),
    providerOptions: {
      openrouter: { reasoning: { enabled: false, exclude: true } },
    },
  });

  const response = await agent.respond({ messages });

  const merged = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders(request, env) as Record<string, string>)) {
    merged.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: merged,
  });
}
