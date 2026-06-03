# sites/agentsox/ — the agentsox.com website

AgentsOX's own marketing site and the backends specific to it.

- `web` — the Vite/React marketing site (deployed as static assets on agentsox.com).
- `intake-worker` + `intake-agent` — the project-intake chat on agentsox.com.
- `mail-worker` — the contact-form mailer.
- `contracts` — shared request/response types for intake + mail.

The FAQ bot is NOT here. It's a product in `products/faq/` that this site **consumes**
like any client (the marketing site embeds the widget with `siteId=agentsox-main`).

Rules:
- This zone is a consumer of `products/` and `platform/`, not the owner of the FAQ product.
- Keep site-specific concerns (brand, intake funnel, mail) here; reusable agents become products.
