/**
 * Edge-inject template — TEMPLATE, deploy on the CLIENT's Cloudflare zone.
 *
 * For a client whose site is behind Cloudflare but whose code we can't touch (e.g.
 * a custom React app), this Worker sits in front of their site, passes every request
 * through to the origin, and uses HTMLRewriter to inject the AgentsOX widget snippet
 * into HTML responses. No change to the client's codebase.
 *
 * Configure SITE_ID + WIDGET_SRC in wrangler.toml [vars] and route it over the
 * client's hostname. See README.md.
 */
interface Env {
  SITE_ID: string;
  WIDGET_SRC: string; // e.g. https://faq.agentsox.com/widget.js
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const response = await fetch(request);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return response;

    const snippet = `<script src="${env.WIDGET_SRC}" data-site-id="${env.SITE_ID}" async></script>`;

    return new HTMLRewriter()
      .on('body', {
        element(el) {
          el.append(snippet, { html: true });
        },
      })
      .transform(response);
  },
};
