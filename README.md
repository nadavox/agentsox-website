# AgentsOX Website

Public website, intake bot, and contact-mail Workers for AgentsOX.

AgentsOX is a founder-led AI and automation agency. The website presents the
brand, services, proof, workshop offer, and a client-facing intake bot that can
answer FAQs, shape a workflow brief, and submit that brief by email.

## Tech Stack

- Frontend: React 19, Vite 8, plain CSS by component in `apps/web`.
- Hosting: Cloudflare Workers (Static Assets) for `https://agentsox.com`.
- Intake Worker: Cloudflare Worker in `workers/intake` for `/api/chat`.
- Mail Worker: Cloudflare Worker in `workers/mail` for `/api/contact`.
- AI: Cloudflare Workers AI in production, deterministic local preview in dev.
- Email: Resend API from the mail Worker only.
- Shared code: `packages/contracts` and `packages/worker-utils`.
- Brand assets: SVG/PNG/JPG files under `apps/web/public/brand`.

## Repository Layout

```text
.
├── apps/web/                    # Vite/React website
├── workers/intake/              # Cloudflare Worker for LLM chat
├── workers/mail/                # Cloudflare Worker for Resend contact email
├── packages/contracts/          # Shared request/response types
├── packages/worker-utils/       # Shared Worker CORS/HTTP/body helpers
└── docs/BRANDBOOK.md            # Written brand rules
```

## Runtime Boundaries

- The website owns UI, local form state, accessibility, and client-side validation.
- The website only calls public Vite endpoint config:
  `VITE_INTAKE_BOT_ENDPOINT` and `VITE_CONTACT_ENDPOINT`.
- `workers/intake` owns `/api/chat`, Workers AI, local bot preview, CORS,
  `siteId` validation, rate limits, and chat logs.
- `workers/mail` owns `/api/contact`, contact validation, Resend delivery, CORS,
  `siteId` validation, rate limits, and email logs.
- `workers/intake` keeps a temporary `/api/contact` compatibility route that
  forwards to `CONTACT_ENDPOINT`.
- Production API requests must come from `https://agentsox.com` or
  `https://www.agentsox.com`.

## Environment

Development web env lives in `apps/web/.env.development`:

```text
VITE_INTAKE_BOT_ENDPOINT=http://127.0.0.1:8787/api/chat
VITE_CONTACT_ENDPOINT=http://127.0.0.1:8788/api/contact
```

Production web env lives in `apps/web/.env.production`:

```text
VITE_INTAKE_BOT_ENDPOINT=https://intake.agentsox.com/api/chat
VITE_CONTACT_ENDPOINT=https://contact.agentsox.com/api/contact
```

Worker local secrets live in ignored `.dev.vars` files:

```text
workers/intake/.dev.vars
workers/mail/.dev.vars
```

Production mail secret:

```bash
cd workers/mail
npx wrangler secret put RESEND_API_KEY --env production
```

## Local Development

Install all workspaces:

```bash
npm install
```

Start the mail Worker:

```bash
npm --workspace @agentsox/mail-worker run dev
```

Start the intake Worker:

```bash
npm --workspace @agentsox/intake-worker run dev
```

Start the website:

```bash
npm run dev
```

Open `http://127.0.0.1:5174/`.

## Main Scripts

```bash
npm run lint
npm run build
npm run typecheck
npm run verify
```

Worker dry runs:

```bash
npm --workspace @agentsox/mail-worker exec -- wrangler deploy --env production --dry-run
npm --workspace @agentsox/intake-worker exec -- wrangler deploy --env production --dry-run
```

## Production Deploy

Deploy Workers first:

```bash
npm --workspace @agentsox/mail-worker run deploy
npm --workspace @agentsox/intake-worker run deploy
```

Website deployment is handled by Cloudflare Workers Builds after pushing to `main`
(see `docs/cloudflare-migration.md` for the migration/cutover runbook).

Current production endpoints:

```text
https://agentsox.com
https://intake.agentsox.com
https://contact.agentsox.com
```

## Smoke Tests

Worker health:

```bash
curl -i https://intake.agentsox.com/health
curl -i https://contact.agentsox.com/health
```

Allowed-origin chat:

```bash
curl -i -X POST https://intake.agentsox.com/api/chat \
  -H 'Origin: https://agentsox.com' \
  -H 'Content-Type: application/json' \
  --data '{"siteId":"agentsox-main","context":{},"messages":[{"role":"user","content":"What does AgentsOX do?"}]}'
```

Contact smoke test sends a real email:

```bash
curl -i -X POST https://contact.agentsox.com/api/contact \
  -H 'Origin: https://agentsox.com' \
  -H 'Content-Type: application/json' \
  --data '{"siteId":"agentsox-main","name":"Production Smoke","email":"nadavoknbarg@gmail.com","message":"Problem: Production smoke test\nBusiness: AgentsOX\nCurrent tools: website, Cloudflare Worker, Resend\nDetails: Verify production contact endpoint sends branded email with AgentsOX Website subject prefix.","source":"agentsox-production-smoke-test"}'
```

Production website bundle should include the production endpoints:

```bash
CONTACT_CHUNK=$(curl -s https://agentsox.com/assets/$(curl -s https://agentsox.com | rg -o 'index-[^"]+\.js' | head -1) | rg -o 'Contact-[A-Za-z0-9_-]+\.js' | head -1)
curl -s "https://agentsox.com/assets/$CONTACT_CHUNK" | rg -o 'https://(intake|contact).agentsox.com/api/(chat|contact)'
```

## Brand Assets

Runtime public URLs stay stable after the repo move:

```text
/brand/agentsox-mark.svg
/brand/agentsox-logo-lockup.svg
/project-previews/360-basketball.png
/project-previews/shades-of-the-soul.png
/project-previews/drone-videographer.png
/og-image.png
/manifest.json
/sitemap.xml
```

Source files live in `apps/web/public`.

## Security Notes

- Never commit `.dev.vars`, `.wrangler`, `node_modules`, or production secrets.
- Rotate `RESEND_API_KEY` if it is ever pasted into chat, logs, screenshots, or
  a browser.
- Keep strict CORS in production. Do not add localhost to production allowed origins.
- Keep request body limits before parsing JSON.
- Keep `siteId` required; do not accept anonymous API payloads.
- Do not log secrets, full lead messages, or raw request bodies.

## Release Checklist

Before push or deploy:

```bash
npm install
npm run verify
npm --workspace @agentsox/mail-worker exec -- wrangler deploy --env production --dry-run
npm --workspace @agentsox/intake-worker exec -- wrangler deploy --env production --dry-run
```

After deploy:

- Verify `https://agentsox.com` loads the new website.
- Verify both Worker health endpoints return `200`.
- Run one allowed-origin chat smoke test.
- Run one contact smoke test and confirm the email arrives with the
  `[AgentsOX Website]` subject prefix and correct Reply-To.
