const DEFAULT_ALLOWED_ORIGINS = [
  'https://agentsox.com',
  'https://www.agentsox.com',
];

const MAX_CONTENT_LENGTH_BYTES = 12_000;

export interface CorsEnv {
  ALLOWED_ORIGINS?: string;
}

export interface SiteEnv {
  SITE_ID?: string;
}

export interface RateLimitEnv {
  API_RATE_LIMITER?: RateLimit;
}

export function getAllowedOrigins(env: CorsEnv): Set<string> {
  const configuredOrigins = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set([...configuredOrigins, ...DEFAULT_ALLOWED_ORIGINS]);
}

export function getRequestOrigin(request: Request): string {
  return request.headers.get('Origin') || '';
}

export function isAllowedOrigin(request: Request, env: CorsEnv): boolean {
  const origin = getRequestOrigin(request);
  if (!origin) return false;
  return getAllowedOrigins(env).has(origin);
}

export function corsHeaders(request: Request, env: CorsEnv): HeadersInit {
  const origin = getRequestOrigin(request);
  const headers: HeadersInit = {
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };

  if (origin && getAllowedOrigins(env).has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

export function handleOptions(request: Request, env: CorsEnv): Response {
  if (!isAllowedOrigin(request, env)) {
    return new Response(null, {
      status: 403,
      headers: corsHeaders(request, env),
    });
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders(request, env),
  });
}

export function jsonResponse(
  request: Request,
  env: CorsEnv,
  body: unknown,
  init: ResponseInit = {},
): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(request, env),
      ...init.headers,
    },
  });
}

export function errorResponse(
  request: Request,
  env: CorsEnv,
  message: string,
  status = 400,
): Response {
  return jsonResponse(request, env, { error: message }, { status });
}

export function isValidSite(env: SiteEnv, siteId?: string): boolean {
  return Boolean(siteId) && (!env.SITE_ID || siteId === env.SITE_ID);
}

export function getRateLimitKey(request: Request): string {
  const ip =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown-ip';
  const origin = request.headers.get('Origin') || 'no-origin';
  return `${origin}:${ip}`.slice(0, 256);
}

export async function enforceRateLimit(
  request: Request,
  env: CorsEnv & RateLimitEnv,
): Promise<Response | null> {
  if (!env.API_RATE_LIMITER) return null;

  const { success } = await env.API_RATE_LIMITER.limit({ key: getRateLimitKey(request) });
  if (success) return null;

  return errorResponse(request, env, 'Too many requests. Please wait and try again.', 429);
}

export function assertRequestSize(request: Request): void {
  const contentLength = Number(request.headers.get('Content-Length') || '0');
  if (contentLength > MAX_CONTENT_LENGTH_BYTES) {
    throw new Error('Request body is too large');
  }
}

export async function readJsonBody<T>(request: Request): Promise<T> {
  assertRequestSize(request);

  if (!request.body) {
    throw new Error('Invalid JSON request');
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalBytes += value.byteLength;
      if (totalBytes > MAX_CONTENT_LENGTH_BYTES) {
        await reader.cancel();
        throw new Error('Request body is too large');
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const text = new TextDecoder().decode(bytes).trim();
    if (!text) throw new Error('Invalid JSON request');
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Invalid JSON request');
  }
}
