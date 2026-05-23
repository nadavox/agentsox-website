# AgentsOX Website

Public website and intake system for AgentsOX.

AgentsOX is a founder-led AI and automation agency. The website presents the
brand, services, proof, workshop offer, and a client-facing intake bot that can
answer FAQs, shape a workflow brief, and submit that brief by email.

## Tech Stack

- Frontend: React 19, Vite 8, plain CSS modules by component.
- UI helpers: Mantine Core for the intake chat controls.
- Motion: Framer Motion.
- Analytics: Vercel Web Analytics.
- Hosting: Vercel for the website.
- Backend: Cloudflare Worker in `services/intake-worker`.
- AI: Cloudflare Workers AI in production, local deterministic preview in dev.
- Email: Resend API from the Worker only.
- Observability: Cloudflare Worker logs and invocation logs are enabled.
- Brand assets: SVG/PNG/JPG files under `public/brand`.

## Repository Layout

```text
.
├── src/                         # Vite/React website
│   ├── components/              # Page sections and shared UI
│   ├── context/                 # Theme provider
│   ├── hooks/                   # React hooks
│   ├── themes/                  # Theme tokens and font config
│   └── utils/                   # Navigation and scrolling helpers
├── public/
│   ├── brand/                   # Logo, founder, and brand assets
│   ├── brandbook.html           # Visual brandbook page
│   └── favicons / manifest / OG images
├── docs/BRANDBOOK.md            # Written brand rules
└── services/intake-worker/      # Cloudflare Worker backend
```

## Frontend / Backend Boundary

Keep this separation strict:

- The website owns UI, local form state, accessibility, and client-side
  validation.
- The website only calls public Vite endpoint config:
  `VITE_INTAKE_BOT_ENDPOINT` and `VITE_CONTACT_ENDPOINT`.
- The website must not know Resend, API keys, or Worker internals.
- The Worker owns `/api/chat`, `/api/contact`, CORS, `siteId` validation,
  request-size limits, rate limits, AI calls, Resend email delivery, and logs.
- `siteId` is required for every Worker API request.
- Production API requests must come from `https://agentsox.com` or
  `https://www.agentsox.com`.

## Environment Files

Vite exposes only `VITE_*` variables to browser code. Treat them as public
configuration, never as secrets.

Development:

```text
VITE_INTAKE_BOT_ENDPOINT=http://127.0.0.1:8787/api/chat
VITE_CONTACT_ENDPOINT=http://127.0.0.1:8787/api/contact
```

Production:

```text
VITE_INTAKE_BOT_ENDPOINT=https://intake.agentsox.com/api/chat
VITE_CONTACT_ENDPOINT=https://intake.agentsox.com/api/contact
```

Worker local secrets live in `services/intake-worker/.dev.vars`, which is
gitignored. Production secrets are set with Wrangler:

```bash
cd services/intake-worker
npx wrangler secret put RESEND_API_KEY --env production
```

## Local Development

Install website dependencies:

```bash
npm install
```

Install Worker dependencies:

```bash
cd services/intake-worker
npm install
```

Start the Worker in local preview mode:

```bash
cd services/intake-worker
npm run dev
```

Start the website:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5174/
```

The local Worker uses `MODEL_PROVIDER=local-preview`, so chat behavior is
deterministic and does not spend model usage. Use `npm run dev:remote-ai` inside
`services/intake-worker` only when you intentionally want real Workers AI.

## Main Scripts

Website:

```bash
npm run lint
npm run build
npm run preview
```

Worker:

```bash
cd services/intake-worker
npm run typecheck
npx wrangler deploy --env production --dry-run
npm run deploy
```

## Production Deploy

Website deployment is handled by Vercel after pushing to `main`.

Worker deployment is manual from the Worker service:

```bash
cd services/intake-worker
npm run deploy
```

Current production Worker domain:

```text
https://intake.agentsox.com
```

After rotating or adding the Resend key:

```bash
cd services/intake-worker
npx wrangler secret put RESEND_API_KEY --env production
```

## Production Smoke Tests

Health:

```bash
curl -i https://intake.agentsox.com/health
```

Chat should reject missing origin:

```bash
curl -i -X POST https://intake.agentsox.com/api/chat \
  -H 'Content-Type: application/json' \
  --data '{"siteId":"agentsox-main","context":{},"messages":[{"role":"user","content":"hello"}]}'
```

Chat should reject bad origin:

```bash
curl -i -X POST https://intake.agentsox.com/api/chat \
  -H 'Origin: https://evil.example' \
  -H 'Content-Type: application/json' \
  --data '{"siteId":"agentsox-main","context":{},"messages":[{"role":"user","content":"hello"}]}'
```

Chat should answer from the allowed production origin:

```bash
curl -i -X POST https://intake.agentsox.com/api/chat \
  -H 'Origin: https://agentsox.com' \
  -H 'Content-Type: application/json' \
  --data '{"siteId":"agentsox-main","context":{},"messages":[{"role":"user","content":"What does AgentsOX do?"}]}'
```

Contact smoke test sends a real email to `nadav@agentsox.com`:

```bash
curl -i -X POST https://intake.agentsox.com/api/contact \
  -H 'Origin: https://agentsox.com' \
  -H 'Content-Type: application/json' \
  --data '{"siteId":"agentsox-main","name":"Production Smoke","email":"nadavoknbarg@gmail.com","message":"Problem: Production smoke test\nBusiness: AgentsOX\nCurrent tools: website, Cloudflare Worker, Resend\nDetails: Verify production contact endpoint sends branded email with AgentsOX Website subject prefix.","source":"agentsox-production-smoke-test"}'
```

Production website bundle should include the production endpoints:

```bash
CONTACT_CHUNK=$(curl -s https://agentsox.com/assets/$(curl -s https://agentsox.com | rg -o 'index-[^"]+\.js' | head -1) | rg -o 'Contact-[A-Za-z0-9_-]+\.js' | head -1)
curl -s "https://agentsox.com/assets/$CONTACT_CHUNK" | rg -o 'https://intake.agentsox.com/api/(chat|contact)'
```

## Email Behavior

The contact form posts JSON to the Worker. The Worker sends with Resend:

- From: `AgentsOX Website <nadav@agentsox.com>`
- To: `nadav@agentsox.com`
- Reply-To: the lead email
- Subject: `[AgentsOX Website] Inquiry from {lead name}`
- Custom reply button subject:
  `Re: [AgentsOX Website] Workflow brief - {problem}`

Use a Gmail filter on subject text `[AgentsOX Website]` to apply the
`AgentsOX Website` label.

## Intake Bot Behavior

The bot supports two jobs:

- FAQ answers about AgentsOX, pricing, process, privacy, reliability, and next
  steps.
- Workflow intake: problem, business type, current tools, and success signal.

Button options are rendered only when the bot response is asking for structured
workflow information. FAQ answers and open-text questions should not render
chips.

The local preview logic and FAQ knowledge live in:

```text
services/intake-worker/src/bots/agentsox.ts
services/intake-worker/src/data/agentsoxKnowledge.json
```

## Brand System

Primary references:

```text
docs/BRANDBOOK.md
public/brandbook.html
public/brand/agentsox-mark.svg
public/brand/agentsox-logo-lockup.svg
public/brand/tokens.json
```

Use the ox mark from `public/brand/agentsox-mark.svg` everywhere the icon is
needed. Avoid recreating another animal/icon variant.

## Security Notes

- Never commit `.dev.vars`, `.wrangler`, `node_modules`, or production secrets.
- Rotate `RESEND_API_KEY` if it is ever pasted into chat, logs, screenshots, or
  a browser.
- Keep strict CORS in production. Do not add localhost to production allowed
  origins.
- Keep request body limits in the Worker before parsing JSON.
- Keep `siteId` required; do not accept anonymous API payloads.
- Worker observability logs are enabled. Do not log secrets, full lead messages,
  or raw request bodies.

## Release Checklist

Before commit or deploy:

```bash
npm run lint
npm run build
cd services/intake-worker && npm run typecheck
cd services/intake-worker && npx wrangler deploy --env production --dry-run
```

After deploy:

- Verify `https://agentsox.com` loads the new website.
- Verify `https://intake.agentsox.com/health` returns `200`.
- Run one allowed-origin chat smoke test.
- Run one contact smoke test and confirm the email arrives with the
  `[AgentsOX Website]` subject prefix and Gmail label.
