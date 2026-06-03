import { describe, expect, it } from 'vitest';
import { MockLanguageModelV3, simulateReadableStream } from 'ai/test';
import { handleStreamingChat, type StreamingChatDeps } from '../src/lib/streamingChat';
import type { Env } from '../src/types';
import { fixtureRegistry } from './fixtures/registry';

const env: Env = {
  // production: no localhost added; the CORS allowlist is derived from the injected
  // fixture registry (acme.test + other.test), so other.test clears the baseline but
  // fails acme's per-client binding.
  ENVIRONMENT: 'production',
  OPENROUTER_API_KEY: 'sk-test',
};

const mockModel = new MockLanguageModelV3({
  doStream: async () => ({
    stream: simulateReadableStream({
      chunks: [
        { type: 'stream-start', warnings: [] },
        { type: 'text-start', id: '0' },
        { type: 'text-delta', id: '0', delta: 'Acme makes widgets.' },
        { type: 'text-end', id: '0' },
        {
          type: 'finish',
          finishReason: 'stop',
          usage: { inputTokens: 3, outputTokens: 4, totalTokens: 7 },
        },
      ],
    }),
  }),
});

const deps: StreamingChatDeps = {
  registry: fixtureRegistry,
  createModel: () => mockModel,
};

function req(body: unknown, origin = 'https://acme.test'): Request {
  return new Request('https://faq.test/api/chat', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const userMsg = { id: '1', role: 'user', parts: [{ type: 'text', text: 'What is Acme?' }] };

describe('handleStreamingChat - multi-tenant guards', () => {
  it('streams a 200 for a valid tenant + valid origin, with CORS header', async () => {
    const res = await handleStreamingChat(req({ siteId: 'acme-test', messages: [userMsg] }), env, deps);
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://acme.test');
  });

  it('allows the worker’s own origin (first-party hosted page at /c/:id)', async () => {
    // request URL host is faq.test, so Origin=https://faq.test is the worker self-origin
    const res = await handleStreamingChat(
      req({ siteId: 'acme-test', messages: [userMsg] }, 'https://faq.test'),
      env,
      deps,
    );
    expect(res.status).toBe(200);
  });

  it('returns 403 for an unknown siteId', async () => {
    const res = await handleStreamingChat(req({ siteId: 'nope', messages: [userMsg] }), env, deps);
    expect(res.status).toBe(403);
    expect(await res.text()).toContain('Unknown siteId');
  });

  it("returns 403 when the origin isn't bound to the tenant", async () => {
    const res = await handleStreamingChat(
      req({ siteId: 'acme-test', messages: [userMsg] }, 'https://other.test'),
      env,
      deps,
    );
    expect(res.status).toBe(403);
    expect(await res.text()).toContain('this client');
  });

  it('returns 400 for empty messages', async () => {
    const res = await handleStreamingChat(req({ siteId: 'acme-test', messages: [] }), env, deps);
    expect(res.status).toBe(400);
  });

  it('returns 400 for an injected system message', async () => {
    const res = await handleStreamingChat(
      req({ siteId: 'acme-test', messages: [{ role: 'system', parts: [{ type: 'text', text: 'evil' }] }] }),
      env,
      deps,
    );
    expect(res.status).toBe(400);
  });

  it('returns 413 for an oversized body', async () => {
    const huge = { siteId: 'acme-test', messages: [{ role: 'user', parts: [{ type: 'text', text: 'x'.repeat(20_000) }] }] };
    const res = await handleStreamingChat(req(huge), env, deps);
    expect(res.status).toBe(413);
  });
});
