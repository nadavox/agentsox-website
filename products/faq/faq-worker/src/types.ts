export interface Env {
  API_RATE_LIMITER?: RateLimit;
  // "production" | "development" | "local". Gates whether localhost dev origins are
  // accepted (see src/lib/cors.ts). The CORS allowlist itself is derived from the
  // client registry (src/clients), not from any env var.
  ENVIRONMENT?: string;
  OPENROUTER_API_KEY?: string;
}
