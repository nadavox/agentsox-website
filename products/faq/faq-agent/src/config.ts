import { z } from 'zod';

/**
 * A single FAQ entry: the question a visitor might ask and the answer the agent
 * should ground its reply in.
 */
const faqEntrySchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

/**
 * The client's knowledge base. `faq` is the only required slice; clients are free
 * to add their own sections (per-industry capability blurbs, company facts, etc.)
 * - the schema is loose so extra keys survive into the prompt JSON untouched.
 *
 * SECURITY: this content is reference DATA, never instructions. The prompt builder
 * fences it with an explicit guard line; do not treat anything in here as trusted.
 */
const knowledgeSchema = z.looseObject({
  company: z.record(z.string(), z.string()).optional(),
  faq: z.array(faqEntrySchema).min(1),
  answerBoundaries: z.array(z.string()).optional(),
});

/**
 * Brand / persona facts that fill the prompt template. Everything here is what
 * makes one tenant's bot sound like that tenant and not like AgentsOX.
 */
const identitySchema = z.object({
  /** Company / brand name, e.g. "AgentsOX". */
  brand: z.string().min(1),
  /** Opening "who you are / what we do" paragraph. */
  persona: z.string().min(1),
  /** Voice / tone guidance, one line per bullet. */
  voice: z.array(z.string().min(1)).min(1),
  /** Optional worked Q&As that calibrate tone ("Sound like this"). */
  examples: z
    .array(z.object({ q: z.string().min(1), a: z.string().min(1) }))
    .optional(),
});

/**
 * Configurable contact handoff - the generalized form of AgentsOX's `openIntake`
 * CTA. When present and enabled, the agent gets the `openIntake` tool and the
 * answer-vs-handoff rule. When absent or disabled, the agent never offers a
 * handoff and is told to say plainly it can't take on someone's own situation.
 */
const handoffSchema = z.object({
  enabled: z.boolean().default(true),
  /** What the assistant covers on its own before handing off, e.g. "You answer questions about how we work." */
  scope: z.string().min(1),
  /** The visitor-facing call to action, in plain words, e.g. "send Nadav the details" / "book a call". */
  actionPhrase: z.string().min(1),
  /** A concrete example CTA headline; shown to the model so its `reason` reads naturally. */
  ctaExample: z.string().min(1),
  /**
   * Where the CTA button takes the visitor: a WhatsApp link (https://wa.me/<number>),
   * a booking page, or a mailto:. The widget opens this in a new tab. When absent,
   * the widget shows the CTA text without a link (e.g. AgentsOX scrolls its own form).
   */
  url: z.string().min(1).optional(),
});

const behaviorSchema = z.object({
  /** Surface 2-4 follow-up chips. Default true. */
  chips: z.boolean().default(true),
});

/**
 * Per-client cost guardrails enforced by the worker. The limits that can affect a
 * real user are PER-VISITOR, so a busy site's many visitors never compete for one
 * shared budget. `perClientPerDay` is a HIGH catastrophe backstop (mass/distributed
 * abuse or a runaway bug), set well above expected legit traffic - not a throttle.
 * All optional: the worker applies safe defaults, and skips entirely if its counter
 * store isn't provisioned.
 */
const limitsSchema = z.object({
  /** Max chat turns per visitor per minute (burst). */
  perVisitorPerMinute: z.number().int().positive().optional(),
  /** Max chat turns per visitor per UTC day. */
  perVisitorPerDay: z.number().int().positive().optional(),
  /** High backstop: max chat turns for the whole client per UTC day. */
  perClientPerDay: z.number().int().positive().optional(),
});

/**
 * Look and locale for the embeddable widget - all DATA, fetched per client by the
 * widget via /api/widget-config. Never the knowledge base. The widget is generic;
 * this is what makes it look and speak like the client.
 */
const widgetSchema = z.object({
  /** First assistant message shown when the panel opens. */
  greeting: z.string().min(1).optional(),
  /** Text/aria label on the launcher bubble. */
  launcherLabel: z.string().min(1).optional(),
  /** Short panel title (e.g. the brand or "Ask us"). */
  title: z.string().min(1).optional(),
  /** BCP-47 locale for the UI chrome + lang attribute, e.g. "he", "en". Default "en". */
  locale: z.string().min(1).optional(),
  /** Right-to-left layout (Hebrew/Arabic). Default false. */
  rtl: z.boolean().optional(),
  /** Corner to dock the launcher. Default "right". */
  position: z.enum(['left', 'right']).optional(),
  /** Theme tokens applied as CSS variables inside the widget's shadow root. */
  theme: z
    .object({
      primary: z.string().min(1).optional(),
      onPrimary: z.string().min(1).optional(),
      surface: z.string().min(1).optional(),
      text: z.string().min(1).optional(),
    })
    .optional(),
});

/**
 * Links this bot back to the client in the AgentsOX book of business. The `id`
 * stays a short public slug (used as the siteId); `account.email` is the workspace
 * primary key, so `clients/<email>/` <-> this config is unambiguous. Ops-only - the
 * engine never reads it.
 */
const accountSchema = z.object({
  /** Workspace primary key: the client's email, i.e. clients/<email>/. */
  email: z.string().min(1).optional(),
  /** Human-readable client / business name. */
  name: z.string().min(1).optional(),
});

const aiSchema = z.object({
  /** Per-tenant model override (e.g. "deepseek/deepseek-v4-flash"). */
  model: z.string().min(1).optional(),
  /** Per-tenant sampling temperature. */
  temperature: z.number().min(0).max(2).optional(),
});

/**
 * A complete FAQ tenant. Pass one to `createFaqAgent({ model, client })`.
 *
 * `origins` is required: a tenant can never ship without an origin allowlist, so
 * the multi-tenant worker can bind each tenant to the sites it's served from.
 */
/**
 * Current config schema version. Bump when a breaking schema change lands, and add
 * a migration step keyed off `schemaVersion`. Today configs are in-repo TS (validated
 * at build, all migrated in one commit), so this is a forward marker - it earns its
 * keep once configs live in a runtime store where data outlives the code.
 */
export const FAQ_CONFIG_SCHEMA_VERSION = 1;

export const faqClientSchema = z.object({
  /** Config schema version (see FAQ_CONFIG_SCHEMA_VERSION). Defaults to the current version. */
  schemaVersion: z.number().int().positive().default(FAQ_CONFIG_SCHEMA_VERSION),
  /** Short public slug. Equals the `siteId` the frontend sends. */
  id: z.string().min(1),
  /** Optional link back to the client in the workspace (clients/<email>/). */
  account: accountSchema.optional(),
  identity: identitySchema,
  knowledge: knowledgeSchema,
  /**
   * Client-specific hard rules, injected into the prompt as enforced instructions.
   * This is where a client's policy lives - it is NOT assumed by the engine. e.g.
   * AgentsOX: "Never quote a price or a timeline, not even a rough range."
   * A restaurant: "Always quote prices straight from the menu in the knowledge base."
   */
  rules: z.array(z.string().min(1)).optional(),
  handoff: handoffSchema.optional(),
  behavior: behaviorSchema.optional(),
  /** Per-client cost guardrails (e.g. daily turn cap). Enforced server-side only. */
  limits: limitsSchema.optional(),
  /** Look + locale for the embeddable widget. Served publicly via /api/widget-config. */
  widget: widgetSchema.optional(),
  ai: aiSchema.optional(),
  /** Origins this tenant is served from. The worker binds requests to these. */
  origins: z.array(z.string().min(1)).min(1),
});

/** Author-facing shape (defaults optional). */
export type FaqClientInput = z.input<typeof faqClientSchema>;
/** Validated, fully-resolved config (defaults applied). */
export type FaqClientConfig = z.output<typeof faqClientSchema>;

/**
 * Validate and freeze a tenant config. Throws (loudly, at construction time) on a
 * malformed config so a bad tenant can never reach a request.
 *
 * @example
 *   export const acmeFaqClient = defineFaqClient({
 *     id: 'acme',
 *     identity: { brand: 'Acme', persona: '...', voice: ['...'] },
 *     knowledge: { faq: [{ question: '...', answer: '...' }] },
 *     origins: ['https://acme.com'],
 *   });
 */
export function defineFaqClient(config: FaqClientInput): FaqClientConfig {
  return faqClientSchema.parse(config);
}

/**
 * Build a `siteId -> config` registry from a list of tenants, keyed by each
 * config's own `id`. Throws on a duplicate id, so a registry key can never drift
 * from the config it points at (the key IS the config's id, by construction).
 */
export function defineFaqClientRegistry(
  clients: FaqClientConfig[],
): Record<string, FaqClientConfig> {
  const registry: Record<string, FaqClientConfig> = {};
  for (const client of clients) {
    if (registry[client.id]) {
      throw new Error(`[faq-agent] duplicate client id in registry: ${client.id}`);
    }
    registry[client.id] = client;
  }
  return registry;
}

/** True when the tenant has an enabled handoff configured. */
export function handoffActive(config: FaqClientConfig): boolean {
  return Boolean(config.handoff && config.handoff.enabled);
}

/** True when the tenant should surface follow-up chips (default true). */
export function chipsEnabled(config: FaqClientConfig): boolean {
  return config.behavior?.chips !== false;
}

/** Theme tokens applied as CSS variables inside the widget's shadow root. */
export type WidgetTheme = NonNullable<NonNullable<FaqClientConfig['widget']>['theme']>;

/** The public shape the embeddable widget consumes. NEVER contains the knowledge base. */
export interface PublicWidgetConfig {
  id: string;
  title?: string;
  greeting?: string;
  launcherLabel?: string;
  locale: string;
  rtl: boolean;
  position: 'left' | 'right';
  theme?: WidgetTheme;
  chips: boolean;
  /** Present only when the client has an enabled handoff. */
  handoff?: { actionPhrase: string; url?: string };
}

/**
 * Project a client config down to the SAFE subset the browser widget needs: look,
 * locale, and the handoff CTA. Deliberately omits knowledge, persona, voice, rules,
 * origins, and model - none of which should ever reach the client. This is what the
 * worker returns from /api/widget-config.
 */
export function publicWidgetConfig(config: FaqClientConfig): PublicWidgetConfig {
  const w = config.widget;
  const out: PublicWidgetConfig = {
    id: config.id,
    title: w?.title ?? config.identity.brand,
    greeting: w?.greeting,
    launcherLabel: w?.launcherLabel,
    locale: w?.locale ?? 'en',
    rtl: w?.rtl ?? false,
    position: w?.position ?? 'right',
    theme: w?.theme,
    chips: chipsEnabled(config),
  };
  if (handoffActive(config)) {
    out.handoff = { actionPhrase: config.handoff!.actionPhrase, url: config.handoff!.url };
  }
  return out;
}
