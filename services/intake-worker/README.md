# AgentsOX Intake Worker

Standalone Cloudflare Worker for the website intake bot.

The website owns the UI. This service owns the bot API contract and the contact
email endpoint.

Cloudflare observability logs and invocation logs are enabled in
`wrangler.toml`. Keep logs structured and avoid secrets, raw request bodies, or
full lead messages.

```http
POST /api/chat
Content-Type: application/json
```

```json
{
  "siteId": "agentsox-main",
  "context": {},
  "messages": [{ "role": "user", "content": "I miss leads from WhatsApp" }]
}
```

```json
{
  "reply": "Got it. What type of business is this for?",
  "context": { "problem": "I miss leads from WhatsApp" },
  "options": ["Clinic / MedSpa", "Real estate", "Coach", "E-commerce", "Local service"],
  "leadReady": false
}
```

## Why Cloudflare

- Worker deploys as one small serverless endpoint.
- Workers AI can run hosted models through `env.AI` with no separate backend.
- AI Gateway can be added later for OpenAI/Anthropic routing, logs, caching, rate limits, and fallback.
- The website remains decoupled: it only calls `VITE_INTAKE_BOT_ENDPOINT`
  and `VITE_CONTACT_ENDPOINT`.

## Local Development

```bash
cd services/intake-worker
npm install
npm run dev
```

Local dev uses the Wrangler `local` environment, which sets `MODEL_PROVIDER=local-preview`. That lets you test the HTTP contract without spending model usage.

To test the real Workers AI binding:

```bash
npm run dev:remote-ai
```

Remote AI dev uses the Wrangler `remote` environment with localhost CORS and:

```toml
WORKERS_AI_MODEL = "@cf/qwen/qwen3-30b-a3b-fp8"
```

The website is mode-based:

```bash
npm run dev
```

Vite reads `.env.development` and calls `http://127.0.0.1:8787/api/chat`.

## Deploy

```bash
cd services/intake-worker
npm run deploy
```

Deploy uses the Wrangler `production` environment, which sets `MODEL_PROVIDER=workers-ai` and routes `intake.agentsox.com` to this Worker.

After the first deploy, set the Resend production secret:

```bash
npx wrangler secret put RESEND_API_KEY --env production
```

## Contact Email Endpoint

The website contact form posts to:

```http
POST /api/contact
Content-Type: application/json
```

```json
{
  "siteId": "agentsox-main",
  "name": "Test User",
  "email": "nadavoknbarg@gmail.com",
  "message": "Problem: missed leads...",
  "source": "agentsox-website-contact"
}
```

`siteId` is required for every request. The Worker validates the request,
sends through Resend, and returns:

```json
{
  "ok": true,
  "requestId": "uuid",
  "messageId": "resend-message-id"
}
```

Set local secrets in `.dev.vars`:

```bash
RESEND_API_KEY=re_your_local_resend_key
```

Set production secrets after the Worker exists:

```bash
npx wrangler secret put RESEND_API_KEY --env production
```

## Production Smoke Tests

Health:

```bash
curl -i https://intake.agentsox.com/health
```

Valid chat request from the production origin:

```bash
curl -i -X POST https://intake.agentsox.com/api/chat \
  -H 'Origin: https://agentsox.com' \
  -H 'Content-Type: application/json' \
  --data '{"siteId":"agentsox-main","context":{},"messages":[{"role":"user","content":"What does AgentsOX do?"}]}'
```

Origin enforcement should reject a bad origin:

```bash
curl -i -X POST https://intake.agentsox.com/api/chat \
  -H 'Origin: https://evil.example' \
  -H 'Content-Type: application/json' \
  --data '{"siteId":"agentsox-main","context":{},"messages":[{"role":"user","content":"hello"}]}'
```

`siteId` enforcement should reject a missing `siteId`:

```bash
curl -i -X POST https://intake.agentsox.com/api/chat \
  -H 'Origin: https://agentsox.com' \
  -H 'Content-Type: application/json' \
  --data '{"context":{},"messages":[{"role":"user","content":"hello"}]}'
```

Contact smoke test sends a real email to `CONTACT_TO_EMAIL`:

```bash
curl -i -X POST https://intake.agentsox.com/api/contact \
  -H 'Origin: https://agentsox.com' \
  -H 'Content-Type: application/json' \
  --data '{"siteId":"agentsox-main","name":"Production Smoke","email":"nadavoknbarg@gmail.com","message":"Problem: Production smoke test\nBusiness: AgentsOX\nCurrent tools: website, Cloudflare Worker, Resend\nDetails: Verify production contact endpoint sends branded email with AgentsOX Website subject prefix.","source":"agentsox-production-smoke-test"}'
```

## Provider Strategy

Default:

```toml
MODEL_PROVIDER = "workers-ai"
WORKERS_AI_MODEL = "@cf/qwen/qwen3-30b-a3b-fp8"
```

This keeps v1 cheap and fast. If quality becomes the bottleneck, keep the same API contract and add an `ai-gateway` provider adapter later.

## Abuse Controls

Current controls:

- Browser origins are enforced in the Worker before `/api/chat` or
  `/api/contact` runs. Requests without an `Origin` header are rejected for
  both API routes.
- Remote and production environments use Cloudflare Workers Rate Limiting.
- Request bodies are capped while streamed from the request body, then
  sanitized before model execution or email delivery.
- The frontend has no standalone bot fallback; the Worker is the only chatbot brain.

Recommended production hardening:

- Add Cloudflare Turnstile to the website and validate the token in this Worker before model execution.
- Add a Cloudflare WAF rate limiting rule on `intake.agentsox.com/api/chat` as an outer edge control.
- Keep Workers Rate Limiting as the inner application-level cost guard.

Turnstile is the stronger browser-abuse control because the client token must be validated server-side, expires after five minutes, and is single-use.
