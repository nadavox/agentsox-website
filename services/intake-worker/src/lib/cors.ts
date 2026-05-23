import type { Env } from '../types';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://agentsox.com',
  'https://www.agentsox.com',
];

export function getAllowedOrigins(env: Env): Set<string> {
  const configuredOrigins = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set([...configuredOrigins, ...DEFAULT_ALLOWED_ORIGINS]);
}

export function getRequestOrigin(request: Request): string {
  return request.headers.get('Origin') || '';
}

export function isAllowedOrigin(request: Request, env: Env): boolean {
  const origin = getRequestOrigin(request);

  if (!origin) return false;

  return getAllowedOrigins(env).has(origin);
}

export function corsHeaders(request: Request, env: Env): HeadersInit {
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

export function handleOptions(request: Request, env: Env): Response {
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
