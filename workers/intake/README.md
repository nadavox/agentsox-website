# AgentsOX Intake Worker

Cloudflare Worker for the website intake bot.

This service owns `/api/chat`, Workers AI calls, deterministic local-preview
chat behavior, CORS, `siteId` validation, request-size limits, rate limits, and
chat logs.

Contact email delivery has moved to `workers/mail`. This Worker keeps a
temporary `/api/contact` compatibility route that forwards to `CONTACT_ENDPOINT`.

## Local Development

```bash
npm --workspace @agentsox/intake-worker run dev
```

Local dev uses Wrangler env `local` and `MODEL_PROVIDER=local-preview`, so chat
behavior is deterministic and does not spend model usage.

To test remote Workers AI:

```bash
npm --workspace @agentsox/intake-worker run dev:remote-ai
```

## Deploy

```bash
npm --workspace @agentsox/intake-worker run deploy
```

Production route:

```text
https://intake.agentsox.com
```

## Smoke Tests

```bash
curl -i https://intake.agentsox.com/health
```

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
