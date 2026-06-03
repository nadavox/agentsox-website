import type { FaqClientConfig } from '@agentsox/faq-agent';

/**
 * Safe defaults applied per client when it sets no `limits`. The per-visitor numbers
 * are what a real person could plausibly hit; the per-client number is a HIGH
 * catastrophe backstop (mass/distributed abuse, runaway bug) set well above any
 * normal site's traffic - it must never throttle legit visitors.
 */
export const QUOTA_DEFAULTS = {
  perVisitorPerMinute: 15,
  perVisitorPerDay: 100,
  perClientPerDay: 20_000,
} as const;

export interface QuotaEnv {
  /**
   * KV namespace holding the turn counters. OPTIONAL: when unbound, quotas are
   * skipped (graceful, like the rate limiter) so the worker runs before it's
   * provisioned. One-time setup enables it for every client at once.
   */
  FAQ_QUOTA_KV?: KVNamespace;
}

export type QuotaScope = 'visitor-minute' | 'visitor-day' | 'client-day';
export type QuotaResult = { ok: true } | { ok: false; scope: QuotaScope; limit: number };

/** Best-effort visitor identity. IP only; spoofable, so it's fairness + abuse-friction, not auth. */
function visitorId(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown-ip'
  );
}

/**
 * Enforce per-visitor (minute + day) and a high per-client/day ceiling, using
 * date-stamped KV counters that expire on their own. The limits that can affect a
 * real user are PER-VISITOR, so many concurrent real visitors never compete - a busy
 * site is never throttled by these. Per-client config overrides the defaults.
 *
 * Cost GUARDRAIL, not billing: KV is eventually consistent, so concurrent requests
 * can undercount slightly. For strict atomic caps, back it with a Durable Object.
 * `now` is injected for deterministic tests.
 */
export async function enforceQuotas(
  env: QuotaEnv,
  client: FaqClientConfig,
  request: Request,
  now: Date,
): Promise<QuotaResult> {
  const kv = env.FAQ_QUOTA_KV;
  if (!kv) return { ok: true }; // not provisioned -> quotas off

  const limit = {
    minute: client.limits?.perVisitorPerMinute ?? QUOTA_DEFAULTS.perVisitorPerMinute,
    day: client.limits?.perVisitorPerDay ?? QUOTA_DEFAULTS.perVisitorPerDay,
    client: client.limits?.perClientPerDay ?? QUOTA_DEFAULTS.perClientPerDay,
  };

  const ip = visitorId(request);
  const iso = now.toISOString();
  const minuteKey = `v:${client.id}:${ip}:${iso.slice(0, 16)}`; // YYYY-MM-DDTHH:MM
  const dayKey = `v:${client.id}:${ip}:${iso.slice(0, 10)}`; // YYYY-MM-DD
  const clientKey = `c:${client.id}:${iso.slice(0, 10)}`;

  const [minuteCount, dayCount, clientCount] = (
    await Promise.all([kv.get(minuteKey), kv.get(dayKey), kv.get(clientKey)])
  ).map((v) => Number(v ?? '0'));

  if (minuteCount >= limit.minute) return { ok: false, scope: 'visitor-minute', limit: limit.minute };
  if (dayCount >= limit.day) return { ok: false, scope: 'visitor-day', limit: limit.day };
  if (clientCount >= limit.client) return { ok: false, scope: 'client-day', limit: limit.client };

  // Under all caps: record the turn (each window's key expires on its own).
  await Promise.all([
    kv.put(minuteKey, String(minuteCount + 1), { expirationTtl: 120 }),
    kv.put(dayKey, String(dayCount + 1), { expirationTtl: 60 * 60 * 36 }),
    kv.put(clientKey, String(clientCount + 1), { expirationTtl: 60 * 60 * 36 }),
  ]);

  return { ok: true };
}
