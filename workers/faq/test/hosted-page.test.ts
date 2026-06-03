import { describe, expect, it } from 'vitest';
import { handleHostedPage } from '../src/lib/hostedPage';
import { fixtureRegistry } from './fixtures/registry';

const deps = { registry: fixtureRegistry };
const page = (path: string) => handleHostedPage(new Request(`https://faq.test${path}`), {}, deps);

describe('GET /c/:siteId (hosted page)', () => {
  it('renders an HTML page that loads the widget for a known client', async () => {
    const res = page('/c/acme-test');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    const html = await res.text();
    expect(html).toContain('https://faq.test/widget.js');
    expect(html).toContain('data-site-id="acme-test"');
    expect(html).toContain('data-open="true"');
  });

  it('404s an unknown client', () => {
    expect(page('/c/nope').status).toBe(404);
  });
});
