# products/faq/ — the FAQ bot product

A reusable FAQ assistant for any client, not specific to agentsox.com. A client is
DATA (a config), never code.

- `faq-agent` — the engine: builds the prompt + tools from an injected, validated client config (`defineFaqClient`). Client-agnostic; client policy lives in `rules[]`.
- `faq-client` — the shared chat wire contract (tool names, transport, parsing) used by every frontend.
- `faq-worker` — the multi-tenant API: resolves a client by `siteId` from the registry, enforces origin binding + rate limit + body validation, streams `/api/chat`, serves `/api/widget-config`, the embeddable `/widget.js`, and the hosted page `/c/:siteId`.
- `widget` — the embeddable Shadow-DOM chat bubble; one `<script>` drops it on any site.
- `widget-inject` — a template Worker for edge-injecting the widget on a client's Cloudflare zone.

Onboard a client: `faq-worker/ADDING-A-CLIENT.md`. Put it on a site: `faq-worker/INTEGRATION.md`.

Rules:
- The engine never holds client data — configs live in `faq-worker/src/clients/`.
- Shared infra (streaming, CORS, rate-limit) comes from `platform/`; don't duplicate it here.
