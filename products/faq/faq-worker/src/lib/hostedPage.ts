import { publicWidgetConfig, type FaqClientConfig } from '@agentsox/faq-agent';
import { FAQ_CLIENTS } from '../clients';

export interface HostedPageDeps {
  registry?: Record<string, FaqClientConfig>;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/**
 * `GET /c/:siteId` - a zero-integration hosted chat page. For clients whose site we
 * can't add a script to (locked platform, no access): we host this page and they
 * just link to it. It loads the same widget from this origin (first-party, so the
 * origin checks pass) and opens it immediately.
 */
export function handleHostedPage(
  request: Request,
  _env: unknown,
  deps: HostedPageDeps = {},
): Response {
  const registry = deps.registry ?? FAQ_CLIENTS;
  const url = new URL(request.url);
  const siteId = url.pathname.replace(/^\/c\//, '').replace(/\/+$/, '');
  const client = registry[siteId];
  if (!client) return new Response('Not found', { status: 404 });

  const pub = publicWidgetConfig(client);
  const title = escapeHtml(pub.title ?? siteId);
  const bg = pub.theme?.surface ?? '#0b0b0f';

  const html = `<!doctype html>
<html lang="${escapeHtml(pub.locale)}" dir="${pub.rtl ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${title}</title>
<style>html,body{margin:0;height:100%;background:${escapeHtml(bg)};}</style>
</head>
<body>
<script src="${url.origin}/widget.js" data-site-id="${escapeHtml(siteId)}" data-open="true" async></script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' },
  });
}
