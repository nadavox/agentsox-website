# AgentsOX Website

React/Vite website for AgentsOX.

## Environments

The bot and contact endpoints are selected by Vite mode. Both values are
required public client config; the contact form does not derive one endpoint
from the other.

```bash
npm run dev
```

Uses `.env.development`:

```text
VITE_INTAKE_BOT_ENDPOINT=http://127.0.0.1:8787/api/chat
VITE_CONTACT_ENDPOINT=http://127.0.0.1:8787/api/contact
```

```bash
npm run build
```

Uses `.env.production`:

```text
VITE_INTAKE_BOT_ENDPOINT=https://intake.agentsox.com/api/chat
VITE_CONTACT_ENDPOINT=https://intake.agentsox.com/api/contact
```

Run the local intake Worker separately:

```bash
cd services/intake-worker
npm install
npm run dev
```

The contact endpoint sends through Resend. Local secrets live in
`services/intake-worker/.dev.vars`; production secrets must be set with
Wrangler, not committed.
