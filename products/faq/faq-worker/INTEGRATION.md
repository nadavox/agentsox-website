# Putting a client's FAQ bot on their website

Once a client config exists (see `ADDING-A-CLIENT.md`) and is deployed, the bot is
reachable. This is how it gets onto the client's site. **One artifact** — a single
`<script>` — covers almost every platform; the rest are fallbacks.

The snippet (the only thing that changes per client is `data-site-id`):

```html
<script src="https://faq.agentsox.com/widget.js" data-site-id="<id>" async></script>
```

It loads a self-contained chat bubble in a Shadow DOM (isolated from the host page's
CSS), fetches the client's look/locale/handoff from `/api/widget-config`, and talks
to `/api/chat`. RTL + locale + theme + WhatsApp/booking CTA all come from the config.

## Three integration tiers

### Tier 1 — Paste the snippet (preferred, works almost everywhere)

| Platform | Where to paste | Plan needed |
|---|---|---|
| **We control the site** (custom React/Vite) | the `<script>` in `index.html`, or render our component | — |
| **Vercel / Next.js** | `next/script` with `strategy="lazyOnload"` in the root layout | their dev |
| **Wix** | Settings → Custom Code → add code, "Body - end", all pages | Premium |
| **Squarespace** | Settings → Advanced → Code Injection → Footer | Business+ |
| **Shopify** | `theme.liquid` before `</body>` (or a theme app embed) | theme edit |
| **WordPress** | footer via a "headers and footers" plugin, or `footer.php` | — |
| **Webflow** | Project Settings → Custom Code → Footer | paid |

Anywhere that allows custom code: paste the snippet before `</body>`.

### Tier 2 — Cloudflare edge-inject (behind CF, no code access)

When the site is behind Cloudflare and nobody can add a tag (e.g. a custom React app
we didn't build), deploy `products/faq/widget-inject` on the **client's** Cloudflare zone.
It injects the snippet at the edge — no change to their code. See
`products/faq/widget-inject/README.md`.

### Tier 3 — Hosted page (no access at all)

We host a ready chat page at:

```
https://faq.agentsox.com/c/<id>
```

The client just links to it (button, bio, socials) — zero integration. It opens the
chat immediately, themed and localized from the config.

## Per-client requirements

- The client's production domain(s) must be in their config `origins` (already set
  by the scaffold). That's what authorizes `/api/chat` and `/api/widget-config` for
  that origin.
- For a WhatsApp/booking CTA, set `handoff.url` in the config (e.g. `https://wa.me/<number>`).
- Look/locale: set the `widget` block (`locale`, `rtl`, `theme`, `greeting`, `title`).

## Verify an install

1. Open the client's page (or `/c/<id>`); the bubble appears in the corner.
2. Open it — the greeting shows in the right language/direction; ask a question and a
   streamed answer comes back in the brand's voice.
3. Trigger a handoff ("can you help me with X") — the CTA button opens `handoff.url`.
4. DevTools → the widget's styles don't leak into the host page and vice-versa
   (Shadow DOM), and `/api/widget-config` returns only look/locale/handoff (never the FAQ).
