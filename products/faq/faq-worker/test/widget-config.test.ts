import { describe, expect, it } from 'vitest';
import { handleWidgetConfig } from '../src/lib/widgetConfig';
import type { Env } from '../src/types';
import { fixtureRegistry } from './fixtures/registry';

const env: Env = { ENVIRONMENT: 'production' };
const deps = { registry: fixtureRegistry };

function req(siteId: string, origin = 'https://acme.test'): Request {
  return new Request(`https://faq.test/api/widget-config?siteId=${siteId}`, {
    headers: { Origin: origin },
  });
}

describe('GET /api/widget-config', () => {
  it('returns the public widget config for a valid client + origin, with CORS', async () => {
    const res = await handleWidgetConfig(req('acme-test'), env, deps);
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://acme.test');
    const body = await res.json();
    expect(body).toMatchObject({ id: 'acme-test', locale: 'en' });
    expect(JSON.stringify(body)).not.toContain('widget shop'); // FAQ answer never shipped
  });

  it('returns 403 for an unknown siteId', async () => {
    const res = await handleWidgetConfig(req('nope'), env, deps);
    expect(res.status).toBe(403);
  });

  it("returns 403 when the origin isn't bound to the client", async () => {
    const res = await handleWidgetConfig(req('acme-test', 'https://other.test'), env, deps);
    expect(res.status).toBe(403);
  });
});
