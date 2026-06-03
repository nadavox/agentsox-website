# Adding a FAQ bot for a new client

The FAQ bot is a **shared service**: one worker (`@agentsox/faq-worker`) serves every
client, keyed by `siteId`. The reusable brain is the `@agentsox/faq-agent` engine -
it knows nothing about any client. A client is just a **config**.

## Mental model

- **Engine** (`packages/faq-agent`) = the single source of truth for *behaviour*.
  Change it once, every client benefits. Bump its version for breaking changes and
  roll clients forward one at a time.
- **Client config** (`workers/faq/src/clients/<slug>.ts` + `<slug>.faq.json`) = the
  only thing that differs per client: brand, voice, rules, FAQ, origins.
- A client's FAQ bot is **not** one of their delivery projects. Projects live in
  `clients/<email>/<project>/` (own repo + deploy). The bot is a subscription to this
  shared service. The only thing that belongs in `clients/<email>/` is a one-line
  pointer (see the last step).
- `id` is a short public **slug** (`acme`) used as the `siteId`. The client's email
  (your workspace primary key) is recorded in `account.email` so `clients/<email>/`
  and this config stay linked.

## One command

```bash
npm --workspace @agentsox/faq-worker run faq:new-client -- <slug> [email]
# e.g.
npm --workspace @agentsox/faq-worker run faq:new-client -- acme hi@acme.com
```

This generates `acme.ts` + `acme.faq.json` from a template and **auto-registers** the
client in `src/clients/index.ts` (so you can't forget the registry). Then:

1. Fill in the TODOs in `src/clients/acme.ts` - `brand`, `persona`, `voice`, `origins`.
   For a chat bubble, also set `handoff.url` (e.g. `https://wa.me/<number>`) and the
   `widget` block (`locale`, `rtl`, `theme`, `greeting`, `title`).
2. Paste the client's Q/A into `src/clients/acme.faq.json`.
3. `npm --workspace @agentsox/faq-worker run typecheck` (validates the config too).
4. `npm --workspace @agentsox/faq-worker run deploy`.
5. Put it on their site with one line (see **`INTEGRATION.md`**):
   ```html
   <script src="https://faq.agentsox.com/widget.js" data-site-id="acme" async></script>
   ```
   No-access fallback: link them to `https://faq.agentsox.com/c/acme`.

That's it - no env vars, no engine changes, no CORS list to maintain (origins come
from the config).

## Config reference

```ts
defineFaqClient({
  id: 'acme',                         // REQUIRED. slug == siteId the site sends
  account: { email: 'hi@acme.com', name: 'Acme' }, // optional, links to clients/<email>/
  identity: {                         // REQUIRED
    brand: 'Acme',
    persona: 'One paragraph: who the assistant is + what the business does.',
    voice: ['Tone lines - what makes it sound human, not robotic.'],
    examples: [{ q: '...', a: '...' }],            // optional, calibrates tone
  },
  knowledge,                          // REQUIRED. imported from ./acme.faq.json (a { faq: [...] })
  rules: ['Client policy as hard rules.'],         // optional. e.g. "Never quote a price"
                                                   //           OR "Always quote the menu price"
  handoff: {                          // optional. omit for a pure Q&A bot
    enabled: true,
    scope: 'You answer questions about Acme.',
    actionPhrase: 'book a call',      // the visitor-facing CTA, in plain words
    ctaExample: 'Book a call about your widget order',
  },
  origins: ['https://acme.com'],      // REQUIRED. PRODUCTION origins only.
                                      //   localhost is added automatically off-prod.
  ai: { model: '...', temperature: 0.5 },          // optional per-client overrides
  behavior: { chips: true },          // optional. chips default on
});
```

What the **engine** enforces for every client (you don't configure these): answer
only from the knowledge base, never hallucinate, no markdown/emoji, clean typography,
and the knowledge is treated as data not instructions. Everything with a business
opinion (pricing stance, handoff, tone) is in the config above.

## Wire contract (for the client's frontend)

`POST <worker-url>/api/chat` with:

```json
{ "siteId": "acme", "messages": [ /* ai-sdk UIMessage[] */ ] }
```

Response is an SSE UI-message stream (`@ai-sdk/react` `useChat` consumes it directly).
Tool parts on the wire: `openIntake` -> `{ reason }`, `setChips` -> `{ chips }`.
Only `user`/`assistant` messages are accepted; the request origin must be in the
client's `origins`.

## Link it back in the workspace

In the client's workspace folder, drop a pointer so `clients/<email>/` indexes the bot
without holding its runtime config:

```
clients/hi@acme.com/agents/faq.md
---
FAQ bot - served by agentsox-faq-worker (shared).
siteId:  acme
config:  agentsox-website / workers/faq/src/clients/acme.ts
domain:  (where the widget is embedded)
```

## When to give a client their own deploy instead

Stay on the shared worker by default. Graduate a client to their own faq-worker deploy
(under `clients/<email>/`) only when they need their **own domain, isolated limits/logs,
or separate billing**. The engine is the same package either way.
