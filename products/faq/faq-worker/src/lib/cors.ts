import type { FaqClientConfig } from '@agentsox/faq-agent';

/**
 * Origins the local dev server runs on. Added to every client only when the worker
 * is NOT running in production, so a client config lists production origins only and
 * still works on localhost without leaking dev access to production.
 */
const DEV_ORIGINS = ['http://localhost:5174', 'http://127.0.0.1:5174'];

function isProduction(environment?: string): boolean {
  return environment === 'production';
}

/**
 * The origins a single client may be called from: its configured production origins,
 * plus the dev origins when not in production.
 */
export function clientOrigins(client: FaqClientConfig, environment?: string): string[] {
  return isProduction(environment) ? client.origins : [...client.origins, ...DEV_ORIGINS];
}

/** Whether `origin` is allowed to call `client` in this environment. */
export function isOriginAllowedForClient(
  client: FaqClientConfig,
  origin: string,
  environment?: string,
): boolean {
  return clientOrigins(client, environment).includes(origin);
}

/**
 * The worker's own origin is always first-party allowed: the hosted chat page at
 * `/c/:siteId` is served from here, so its widget calls back with this Origin.
 */
export function requestOriginAllowed(
  request: Request,
  client: FaqClientConfig,
  environment?: string,
): boolean {
  const origin = request.headers.get('Origin') || '';
  const self = new URL(request.url).origin;
  return origin === self || isOriginAllowedForClient(client, origin, environment);
}

/**
 * The deployment-wide CORS allowlist: the union of every client's allowed origins.
 * This is the single source of truth - derived from the client registry, never from
 * a hand-maintained env var. Returned as the comma-joined string `worker-utils`
 * expects for `ALLOWED_ORIGINS`.
 */
export function allowedOriginsCsv(
  registry: Record<string, FaqClientConfig>,
  environment?: string,
): string {
  const origins = new Set<string>();
  for (const client of Object.values(registry)) {
    for (const origin of clientOrigins(client, environment)) origins.add(origin);
  }
  return [...origins].join(',');
}

/**
 * Build the `CorsEnv` the worker-utils CORS helpers expect: the real env plus an
 * `ALLOWED_ORIGINS` derived from the registry (every client's origins) and the
 * worker's own origin (first-party hosted page). Single place that assembles it, so
 * the chat handler, the widget-config handler, and the top-level router agree.
 */
export function buildCorsEnv<E extends { ENVIRONMENT?: string }>(
  request: Request,
  registry: Record<string, FaqClientConfig>,
  env: E,
): E & { ALLOWED_ORIGINS: string } {
  const csv = allowedOriginsCsv(registry, env.ENVIRONMENT);
  return { ...env, ALLOWED_ORIGINS: `${csv},${new URL(request.url).origin}` };
}
