import type { Env } from '../types';
import { corsHeaders } from './cors';

export function jsonResponse(
  request: Request,
  env: Env,
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
  env: Env,
  message: string,
  status = 400,
): Response {
  return jsonResponse(request, env, { error: message }, { status });
}
