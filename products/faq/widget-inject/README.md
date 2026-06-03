# widget-inject (template)

Edge-inject the FAQ widget into a client's site **without touching their code** —
for clients on Cloudflare whose frontend we don't control (e.g. Shades of Soul, a
custom React app behind CF).

This is a **template**, deployed on the **client's** Cloudflare account/zone (not
AgentsOX's). It proxies their site and uses `HTMLRewriter` to append one
`<script>` tag to every HTML response.

## When to use which integration

1. **Paste the snippet** (preferred) — if anyone can add a `<script>` to the site:
   ```html
   <script src="https://faq.agentsox.com/widget.js" data-site-id="<id>" async></script>
   ```
2. **This edge-inject** — site is behind Cloudflare, no code access, but we can get
   their CF zone.
3. **Hosted page** — no access at all: link to `https://faq.agentsox.com/c/<id>`.

## Deploy (per client)

1. Copy this folder; in `wrangler.toml` set `SITE_ID`, `WIDGET_SRC`, and the
   `routes` to the client's hostname(s).
2. From this folder, authenticated against the **client's** Cloudflare account:
   ```bash
   npm i -D wrangler @cloudflare/workers-types
   npx wrangler deploy
   ```
3. The widget's per-client `origins` config must include the client's domain (it
   already does for production), so `/api/widget-config` and `/api/chat` accept it.

## Caveats

- Only rewrites `text/html` responses; assets/APIs pass straight through.
- If the client later removes the route or moves off Cloudflare, the widget
  disappears — switch them to the pasted snippet when possible.
