# Vercel → Cloudflare migration runbook

Consolidating the AgentsOX site off Vercel onto Cloudflare (Workers Static Assets), next to
the 3 bot workers that already run there. The `agentsox.com` zone is already on Cloudflare.

**End state:** apex `agentsox.com` served by an assets-only Worker (`agentsox-web`); `www` 301s
to apex via a Redirect Rule; the 3 bot workers (`intake`, `faq`, `mail`) stay separate; all 4
workers auto-deploy via Workers Builds; analytics on Cloudflare Web Analytics; Vercel deleted last.

> Code/config for Phases 1–2 is **done in the repo** (branch `migrate-to-cloudflare`). This doc
> covers the dashboard/DNS steps that can't be done from the repo (Phases 3–5) plus the one
> required manual value (the Web Analytics token). **Production stays on Vercel until Phase 4,
> which you trigger.**
>
> A **zero-impact preview** of the assets-only Worker is already deployed (no routes/custom
> domain, so it does not touch production): **https://agentsox-web.nadavoknbarg.workers.dev**.
> The full static/SEO + header policy was verified against it live (see "Preview verification").

---

## ✓ Web Analytics token — done

The Cloudflare Web Analytics site for `agentsox.com` is set up with **manual** install ("Enable with
JS Snippet installation") and automatic injection **disabled** — so the single manual beacon in
`apps/web/index.html` is the only one on the page (no double counting). The public token is wired into
the beacon and verified live on the preview. SPA route tracking is on by default (the beacon overrides
the History API); we deliberately do **not** set `"spa": false` (that string in Cloudflare's own
copy-paste example *disables* it). The token is a public site identifier, safe to commit.

---

## What changed in the repo (Phases 1–2, done)

| File | Change |
|---|---|
| `apps/web/wrangler.toml` *(new)* | Assets-only Worker `agentsox-web`, top-level config, `not_found_handling = "single-page-application"`, `html_handling = "drop-trailing-slash"`. Apex custom-domain route is commented until cutover. |
| `apps/web/.nvmrc` *(new)* | `22` (Vite 8 needs Node ≥20). |
| `apps/web/public/_headers` *(new)* | Full header policy ported from `vercel.json` (see notes below). |
| `apps/web/package.json` | Removed `@vercel/analytics`; added `wrangler` devDep + `"deploy": "wrangler deploy"`. |
| `apps/web/src/main.jsx` | Removed the `<Analytics />` component + import. |
| `apps/web/index.html` | Added the Cloudflare Web Analytics manual beacon (before `</body>`). |
| `apps/web/src/components/Legal/PrivacyPolicy.jsx` | Vercel → Cloudflare for hosting + analytics (4 references). |
| `apps/web/src/components/Legal/TermsOfService.jsx` | Dropped Vercel from the third-party vendor list. |

**Three corrections to the original plan, confirmed against current Cloudflare docs + the live preview:**

- The plan assumed hashed `/assets/*` are *"immutable by default — no rule needed."* They are **not**:
  Workers Static Assets serves *every* file (hashed or not) as `Cache-Control: public, max-age=0,
  must-revalidate` + an `ETag`. So `_headers` includes an explicit `/assets/*` immutable rule to
  keep Vercel's year-long caching. Without it you'd get a 304 round-trip on every asset load.
  *(Verified live: the hashed asset returns `max-age=31536000, immutable`.)*
- `_headers` **comma-joins** rules that set the *same* header (there is no "most specific wins").
  So `/*` sets **only** HSTS, and every `Cache-Control` pattern is non-overlapping. HTML is left to
  Cloudflare's default (`max-age=0, must-revalidate`), which already matches the old Vercel behavior.
- **Trailing slashes:** Cloudflare's default `html_handling = "auto-trailing-slash"` 307-redirects
  `/ai-chatbots` → `/ai-chatbots/`, but the site's `<link rel="canonical">` tags and `sitemap.xml`
  use the **no-trailing-slash** form (and Vercel served those at 200). Left unfixed, every prerendered
  route would redirect away from its own canonical URL — an SEO regression. Fixed with
  `html_handling = "drop-trailing-slash"`: `/ai-chatbots` now serves **200** at the canonical URL, and
  `/ai-chatbots/` 307s **to** the canonical. (Caveat: this also gives standalone `.html` files clean
  URLs — `/brandbook.html` and the Google verification `.html` 307 → their no-`.html` path, which serves
  the content at 200. See the Google verification note in Phase 4.)

---

## Preview verification (already done, against the live workers.dev preview)

Validated on `https://agentsox-web.nadavoknbarg.workers.dev` — zero production impact:

- All 14 prerendered routes serve **200** at their canonical no-trailing-slash URL; home carries the
  hero copy, the `#faq` section, and the `"@type":"FAQPage"` JSON-LD; the analytics beacon is present
  on every page.
- SPA fallback: an unknown path returns 200 (root shell for client-side routing).
- `_headers` applies correctly at the edge:
  - HTML (`/`, `/ai-chatbots`) → `Cache-Control: public, max-age=0, must-revalidate` (matches Vercel).
  - Hashed `/assets/*.js` → `Cache-Control: public, max-age=31536000, immutable`.
  - `favicon*`, `og-image*` globs, `apple-touch-icon.png`, `manifest.json`, `sitemap.xml`,
    `robots.txt` → `max-age=86400`.
  - `Strict-Transport-Security: max-age=63072000` on every response (no comma-joining).
- Not tested here (post-cutover only): the bots — their CORS allowlist blocks `*.workers.dev`.
- Analytics not recording on the preview is expected — the beacon still has the placeholder token.

To refresh the preview after a change: `cd apps/web && npm run build && npx wrangler deploy`.
To delete it: `npx wrangler delete --name agentsox-web` (do this if you don't want a stray preview).

---

## Phase 3 — Workers Builds (push-to-deploy for all 4 workers)

> ✅ **Done (2026-05-29):** all 4 Workers are connected to `nadavox/agentsox-website`, production
> branch `main`. Deploy — web: `npm --workspace @agentsox/web run deploy`; bots:
> `npm --workspace @agentsox/<x>-worker run deploy` (= `--env production`). Build — web:
> `npm run build` (root script delegates to `@agentsox/web`); bots: *none*. Non-production builds:
> web **on**, bots **off**. Build watch paths are **configured per worker with single-`*` globs**
> (see the table below) and **verified** — a docs-only push rebuilds none of the four; each worker
> rebuilds only when its own dir or a shared package it uses changes. Note: Workers Builds' Git
> connection is dashboard-only (no API/wrangler), so this phase was set up in the UI.

Connect the GitHub repo to **4** separate Workers Builds (Workers & Pages → each Worker → Settings →
Builds → Connect repo). Defaults are wrong for a monorepo — set these explicitly.

**All builds:** Install command = `npm ci`.

### `agentsox-web`
- Build command: `npm ci && npm --workspace @agentsox/web run build`
- Deploy command: `npm --workspace @agentsox/web run deploy`  (= `wrangler deploy`, top-level config)
- Wrangler config path: `apps/web/wrangler.toml`
- Non-production / preview builds: **enabled**.

### `intake` / `faq` / `mail` (bots)
- Deploy command: `npm --workspace @agentsox/<x>-worker run deploy`  (= `wrangler deploy --env production`)
- Non-production / preview builds: **disabled** — the bots only define `[env.production]`, so a
  default (non-`--env production`) build would deploy a misconfigured Worker.

### Build watch paths (avoid rebuilding everything on every push)

Use the **transitive** dependency closure, not just the worker dir, **and single-`*` globs**.
Two gotchas (learned the hard way): Cloudflare's matcher does **not** support `**`, and a lone `*`
chip means "match everything" — so delete any lone `*`. A single `*` already spans sub-folders
(`apps/web/*` covers all nested files).

| Worker | Include paths |
|---|---|
| `agentsox-web` | `apps/web/*` |
| `intake` | `workers/intake/*`, `packages/intake-agent/*`, `packages/agent-core/*`, `packages/contracts/*`, `packages/worker-utils/*` |
| `faq` | `workers/faq/*`, `packages/faq-agent/*`, `packages/agent-core/*`, `packages/worker-utils/*` |
| `mail` | `workers/mail/*`, `packages/contracts/*`, `packages/worker-utils/*` |

(Closure: `intake` → intake-agent → agent-core, plus contracts + worker-utils. `faq` → faq-agent →
agent-core, plus worker-utils. `mail` → contracts + worker-utils.) Optionally add `package-lock.json`
to each if a dependency bump should rebuild everything. Note: builds run regardless of these paths
if a push has 0 changes, 3000+ changed files, or 20+ commits. **Verified 2026-05-30:** a docs-only
push rebuilds none of the four.

---

## Phase 4 — Cutover (you trigger this)

### Pre-cutover repo gate (all green on `migrate-to-cloudflare` as of this writing)
```bash
npm run verify                                  # lint + build + typecheck  ✅
npm --workspace @agentsox/intake-worker test    # 12 passed                 ✅
npm --workspace @agentsox/web run build         # 14 prerendered routes     ✅
( cd apps/web && npx wrangler deploy --dry-run ) # config valid, 100 assets ✅
```
Then merge `migrate-to-cloudflare` → `main`.

### DNS snapshot FIRST (rollback insurance)
Export **all** records (A/AAAA/CNAME/MX/TXT/CAA/NS) with proxy status + TTL. **Actual** rollback values
(the live zone differed from the original plan — apex was a CNAME, not A records):
- apex `agentsox.com` → **CNAME `cname.vercel-dns.com`** (dns-only, ttl 1)
- `www.agentsox.com` → **CNAME `cname.vercel-dns.com`** (dns-only, ttl 1)
- Full snapshot saved at `~/agentsox-dns-snapshot.json`.

**Do NOT touch MX / TXT / CAA** (email + Google/Zoho/Railway verification + DKIM/SPF/DMARC). Note:
Google Search Console is verified via a **DNS TXT** record on the apex (`google-site-verification=…`),
so the `googlef…​.html` file's clean-URL 307 is irrelevant to verification.

### Cutover steps
1. **Pre-stage the Worker:** confirm `agentsox-web` serves on `agentsox-web.<account>.workers.dev`.
2. **Pre-stage www → apex:** the redirect can go in before the apex flip.
   - Replace the `www` CNAME with a **proxied placeholder** so the edge receives www traffic and the
     rule fires (Single Redirects only run on proxied/orange-cloud hostnames):
     `A  www  192.0.2.1  Proxied` (the target is never reached — the rule short-circuits with a 301).
   - Rules → **Redirect Rules → Create (Single Redirect)**:
     - Match (wildcard): Request URL = `https://www.*`
     - Then: Type = **Wildcard**, Target = `https://${1}`, Status = **301**, **Preserve query string = ON**
     - (Expression equivalent: match `(http.host eq "www.agentsox.com")`, dynamic target
       `concat("https://agentsox.com", http.request.uri.path)`, 301, preserve query.)
3. **Flip the apex** (the actual cutover):
   - Delete the **apex A records** (Vercel) — A and CNAME cannot coexist on one name, so the Worker
     custom domain can't attach while they exist.
   - Workers & Pages → `agentsox-web` → **Domains & Routes → Add → Custom Domain** → `agentsox.com`.
     Cloudflare creates the Worker-pointing (CNAME-flattened) record and issues an Advanced
     Certificate. Allow a brief window for cert issuance.
   - Uncomment the `[[routes]]` block in `apps/web/wrangler.toml` so the binding is also in code
     (optional but keeps config reproducible; the dashboard add is what actually attaches it).
4. **HSTS:** the apex already sends HSTS via `_headers`. For full coverage (incl. the www 301, which
   is generated at the edge *before* the Worker), enable **zone-level HSTS** — SSL/TLS → Edge
   Certificates → Enable HSTS — *after* HTTPS is verified working, and pair with **Always Use HTTPS**.
   ⚠️ HSTS footgun: a long `max-age` locks visitors to HTTPS for that duration; verify first, ramp up,
   don't preload until confident.
5. **Leave the Vercel project + its domain mappings intact.** Rollback must not depend on Vercel.

### Verify live
```bash
curl -sI https://agentsox.com                 # 200, served by Cloudflare
curl -sI https://www.agentsox.com             # 301 → https://agentsox.com (path + query preserved)
curl -s  https://agentsox.com/ | grep -c FAQPage          # home FAQ JSON-LD present
curl -sI https://agentsox.com/ai-chatbots                 # 200 (canonical, no trailing slash)
curl -sI https://agentsox.com/ai-chatbots/                # 307 → /ai-chatbots (canonical)
curl -sI https://agentsox.com/robots.txt                  # 200
curl -sI https://agentsox.com/sitemap.xml                 # 200, Cache-Control: max-age=86400
curl -sI https://agentsox.com/assets/<hashed>.js          # Cache-Control: ...immutable
curl -sIL https://agentsox.com/googlef7ef4672edd6e17e.html # 307 → /googlef... → 200 (see note below)
# No `workers.dev` strings in output; canonical URLs all point to apex.
```

**Google site verification — make it robust.** With `drop-trailing-slash`, the verification file
`/googlef7ef4672edd6e17e.html` returns a 307 to its no-`.html` path (which serves the exact
verification content at 200). Googlebot generally follows redirects, but to remove all doubt about
Search Console re-verification, **add a second verification method that doesn't depend on the file
path**: in Search Console add the property via **DNS TXT record** (the `agentsox.com` zone is on
Cloudflare, so this is a one-record add) — or the **HTML meta tag** method (a `<meta
name="google-site-verification" …>` in `index.html`, which is prerendered into every page and always
served at 200). Search Console keeps a site verified as long as *any one* method validates.
**Bots** (must keep working — same origin, different host):
```bash
curl -sI -X OPTIONS https://intake.agentsox.com/api/chat -H 'Origin: https://agentsox.com' \
  -H 'Access-Control-Request-Method: POST'                # 200/204 + CORS headers
# then a POST with Origin: https://agentsox.com should stream a reply.
```
Confirm Cloudflare Web Analytics shows hits (no double-count). Resubmit the sitemap in Search Console.

### Rollback (DNS/rule only — instant, no Vercel changes needed)
1. Workers → `agentsox-web` → Domains & Routes → remove the `agentsox.com` custom domain.
2. Re-add the apex A records from the snapshot (`76.76.21.123`, `66.33.60.35`).
3. Disable/delete the www Redirect Rule and restore the `www` CNAME (`cname.vercel-dns.com`).
Vercel resumes serving immediately because its project + domain mappings were left intact.

---

## Phase 5 — Cleanup (after a stable rollback window)

1. Delete `vercel.json` and `.vercel/` from the repo.
2. Delete the Vercel project (`prj_6FyajHpjjjClQytXVICxKuRM9gPw`, org
   `team_ili1ghMZXSF3NBllHVkT9G1n`) and its domain mappings.
3. Confirm the Privacy Policy / Terms no longer reference Vercel (already updated in Phase 2).

---

## `_headers` quick reference (what's deployed)

```
/*                        Strict-Transport-Security: max-age=63072000   (HSTS only — never Cache-Control)
/assets/*                 Cache-Control: public, max-age=31536000, immutable   (hashed build assets)
/favicon*  /icon-*  /icons.svg  /og-image*  /apple-touch-icon.png
/manifest.json  /sitemap.xml  /robots.txt
                          Cache-Control: public, max-age=86400          (1-day, non-hashed static)
HTML (/, /<route>/, SPA fallback)  →  Cloudflare default: public, max-age=0, must-revalidate + ETag
```
Note: `_headers`/`_redirects` apply to static-asset responses only (not Worker code) — fine here,
since `agentsox-web` is assets-only.
