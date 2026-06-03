# AgentsOX Mail Worker

Cloudflare Worker for website contact submissions and Resend email delivery.

This service owns `/api/contact`, contact payload validation, email rendering,
Resend delivery, CORS, `siteId` validation, rate limits, and email logs.

## Local Development

```bash
npm --workspace @agentsox/mail-worker run dev
```

Set local secrets in ignored `.dev.vars` (in this folder):

```bash
RESEND_API_KEY=re_your_local_resend_key
```

## Deploy

Set the production Resend secret once:

```bash
cd sites/agentsox/mail-worker
npx wrangler secret put RESEND_API_KEY --env production
```

Deploy:

```bash
npm --workspace @agentsox/mail-worker run deploy
```

Production route:

```text
https://contact.agentsox.com
```

## Smoke Tests

```bash
curl -i https://contact.agentsox.com/health
```

This sends a real email:

```bash
curl -i -X POST https://contact.agentsox.com/api/contact \
  -H 'Origin: https://agentsox.com' \
  -H 'Content-Type: application/json' \
  --data '{"siteId":"agentsox-main","name":"Production Smoke","email":"nadavoknbarg@gmail.com","message":"Problem: Production smoke test\nBusiness: AgentsOX\nCurrent tools: website, Cloudflare Worker, Resend\nDetails: Verify production contact endpoint sends branded email with AgentsOX Website subject prefix.","source":"agentsox-production-smoke-test"}'
```
