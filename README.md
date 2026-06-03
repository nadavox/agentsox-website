# AgentsOX platform monorepo

> Despite the repo name (`agentsox-website`), this is a small monorepo that holds
> AgentsOX's marketing site **and** a reusable product. It's organized into three
> zones, each with its own `AGENTS.md`:

```text
.
├── platform/                 # shared, client-agnostic infrastructure
│   ├── agent-core/           #   transport-agnostic streaming chat agent
│   └── worker-utils/         #   CORS, origin checks, rate limiting, body helpers
├── products/
│   └── faq/                  # the FAQ bot PRODUCT (reusable for any client)
│       ├── faq-agent/        #   engine: builds prompt + tools from a client config
│       ├── faq-client/       #   shared chat wire contract (used by every frontend)
│       ├── faq-worker/       #   multi-tenant API + widget hosting + client registry
│       ├── widget/           #   embeddable Shadow-DOM chat bubble (one <script>)
│       └── widget-inject/    #   edge-inject template (sites we can't paste into)
└── sites/
    └── agentsox/             # the agentsox.com website + its own backends
        ├── web/              #   Vite/React marketing site (static assets)
        ├── intake-worker/    #   project-intake chat  (/api/chat)
        ├── intake-agent/     #   intake engine
        ├── mail-worker/      #   contact-form mailer  (/api/contact)
        └── contracts/        #   shared intake/mail types
```

npm workspaces: `platform/*`, `products/faq/*`, `sites/agentsox/*`. Internal deps
resolve by package name (`@agentsox/*: "*"`), so packages can move without rewiring.

## The FAQ product

A multi-tenant FAQ assistant: a client is **data** (one validated config), never
code. The engine is client-agnostic; client policy lives in `rules[]`. The worker
resolves a client by `siteId`, enforces CORS + per-client origin binding + per-visitor
quotas + request validation, streams `/api/chat`, serves `/api/widget-config`, the
embeddable `/widget.js`, and a hosted page `/c/:siteId`. Deployed at `faq.agentsox.com`.

- Onboard a client: `products/faq/faq-worker/ADDING-A-CLIENT.md`
- Put it on a site: `products/faq/faq-worker/INTEGRATION.md`

**agentsox.com dogfoods this product** — the site embeds the same widget as any
client (`siteId=agentsox-main`), so it carries no FAQ code of its own.

## The website (sites/agentsox)

The marketing site plus the backends specific to it: the intake chat
(`intake.agentsox.com`) and the contact mailer (`contact.agentsox.com`). These are
site-specific, not products.

## Environment

- The site's public build vars live in `sites/agentsox/web/.env.development` and
  `.env.production`. These are **Vite `VITE_*` vars, inlined into the browser bundle
  — public by design**, which is why `.gitignore` intentionally tracks them while
  ignoring every other `.env*` and all `.dev.vars`.
- Worker secrets (e.g. `OPENROUTER_API_KEY`, `RESEND_API_KEY`) live in ignored
  `.dev.vars` files locally and as `wrangler secret put ...` in production. Never
  commit a secret-bearing env file.

## Local development

```bash
npm install
npm run dev:all     # web + intake + faq + mail workers together
# or individually, e.g.:
npm --workspace @agentsox/faq-worker run dev
npm run dev         # just the website -> http://127.0.0.1:5174/
```

The FAQ worker builds the widget automatically before dev/deploy (`predev`/`predeploy`).

## Scripts

```bash
npm run lint        # website eslint
npm run build       # website production build (Vite + prerender)
npm run typecheck   # all workers (tsc --noEmit)
npm run verify      # lint + build + typecheck
```

Per-package tests (vitest):

```bash
npm --workspace @agentsox/faq-agent  run test
npm --workspace @agentsox/faq-worker run test
npm --workspace @agentsox/intake-worker run test
```

## Production deploy

Each Worker deploys independently (`wrangler deploy --env production`):

```bash
npm --workspace @agentsox/faq-worker    run deploy   # faq.agentsox.com
npm --workspace @agentsox/intake-worker run deploy   # intake.agentsox.com
npm --workspace @agentsox/mail-worker   run deploy   # contact.agentsox.com
```

The website (`agentsox.com`) deploys via Cloudflare on push to `main`.

One-time FAQ worker setup (then every client gets it free): set the
`OPENROUTER_API_KEY` secret, and to enable quota guardrails create the
`FAQ_QUOTA_KV` namespace and uncomment its binding in `products/faq/faq-worker/wrangler.toml`.

## Security notes

- Never commit `.dev.vars`, `.wrangler`, `node_modules`, or any secret-bearing env file.
  (The site's `.env.*` files are public Vite vars — see Environment.)
- Public chat endpoints are protected by per-client origin binding, per-IP rate
  limiting, per-visitor + per-client quotas, and request-body validation that rejects
  client-injected system/tool parts. Origin checks are CORS/abuse-prevention, not auth.
- Keep `siteId` required; the client registry is the allowlist. Don't log secrets or
  raw user messages.
- Production origins only in client configs; localhost is added automatically off-prod.
