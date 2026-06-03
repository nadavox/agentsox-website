export interface Env {
  API_RATE_LIMITER?: RateLimit;
  // Per-visitor / per-client turn counters for the quota guardrails. Optional:
  // unbound -> quotas off (see src/lib/quota.ts). Provision once to enable for all.
  FAQ_QUOTA_KV?: KVNamespace;
  // "production" | "development" | "local". Gates whether localhost dev origins are
  // accepted (see src/lib/cors.ts). The CORS allowlist itself is derived from the
  // client registry (src/clients), not from any env var.
  ENVIRONMENT?: string;
  OPENROUTER_API_KEY?: string;
}
