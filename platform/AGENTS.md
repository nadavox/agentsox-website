# platform/ — shared infrastructure

Framework- and client-agnostic libraries used by both `products/` and `sites/`.

- `agent-core` — the transport-agnostic streaming chat agent (`createAgent({ buildSystem, tools })` → a `Response`). Knows nothing about any product or client.
- `worker-utils` — CORS, origin checks, tenant-aware rate limiting, JSON/body helpers for Cloudflare Workers.

Rules:
- Keep this layer generic. No product- or client-specific logic, no business policy, no brand wording.
- Anything reused across more than one product belongs here; anything specific to one product belongs in that product.
