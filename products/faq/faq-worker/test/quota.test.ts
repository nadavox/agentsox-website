import { defineFaqClient } from '@agentsox/faq-agent';
import { describe, expect, it } from 'vitest';
import { enforceQuotas } from '../src/lib/quota';

/* eslint-disable @typescript-eslint/no-explicit-any */

function fakeKV() {
  const store = new Map<string, string>();
  return {
    get: async (k: string) => store.get(k) ?? null,
    put: async (k: string, v: string) => {
      store.set(k, v);
    },
  } as any;
}

// Fixed so all calls in a test share the same minute/day keys.
const now = new Date('2026-06-04T10:00:00.000Z');
const req = (ip = '1.2.3.4') =>
  new Request('https://faq.test/api/chat', { headers: { 'CF-Connecting-IP': ip } });

const client = (limits: any) =>
  defineFaqClient({
    id: 'acme',
    identity: { brand: 'Acme', persona: 'p', voice: ['v'] },
    knowledge: { faq: [{ question: 'q', answer: 'a' }] },
    origins: ['https://acme.test'],
    limits,
  });

describe('enforceQuotas', () => {
  it('no-ops when KV is unbound', async () => {
    expect(await enforceQuotas({}, client({}), req(), now)).toEqual({ ok: true });
  });

  it('blocks a visitor over the per-minute burst', async () => {
    const env = { FAQ_QUOTA_KV: fakeKV() };
    const c = client({ perVisitorPerMinute: 2 });
    expect((await enforceQuotas(env, c, req(), now)).ok).toBe(true);
    expect((await enforceQuotas(env, c, req(), now)).ok).toBe(true);
    expect(await enforceQuotas(env, c, req(), now)).toEqual({
      ok: false,
      scope: 'visitor-minute',
      limit: 2,
    });
  });

  it('isolates visitors - a busy site is NOT throttled', async () => {
    const env = { FAQ_QUOTA_KV: fakeKV() };
    const c = client({ perVisitorPerMinute: 1 });
    expect((await enforceQuotas(env, c, req('1.1.1.1'), now)).ok).toBe(true); // visitor A capped after this
    expect((await enforceQuotas(env, c, req('2.2.2.2'), now)).ok).toBe(true); // visitor B unaffected
    expect((await enforceQuotas(env, c, req('3.3.3.3'), now)).ok).toBe(true); // visitor C unaffected
  });

  it('blocks a visitor over the per-day cap', async () => {
    const env = { FAQ_QUOTA_KV: fakeKV() };
    const c = client({ perVisitorPerMinute: 100, perVisitorPerDay: 1 });
    expect((await enforceQuotas(env, c, req(), now)).ok).toBe(true);
    expect(await enforceQuotas(env, c, req(), now)).toEqual({
      ok: false,
      scope: 'visitor-day',
      limit: 1,
    });
  });

  it('enforces the per-client ceiling across different visitors', async () => {
    const env = { FAQ_QUOTA_KV: fakeKV() };
    const c = client({ perVisitorPerMinute: 100, perVisitorPerDay: 100, perClientPerDay: 1 });
    expect((await enforceQuotas(env, c, req('1.1.1.1'), now)).ok).toBe(true);
    expect(await enforceQuotas(env, c, req('2.2.2.2'), now)).toEqual({
      ok: false,
      scope: 'client-day',
      limit: 1,
    });
  });
});
