import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type LanguageModel,
  type ToolSet,
} from 'ai';
import { applyReplacements, sanitizeOutputTransform } from './sanitize';
import type { AgentRespondInput, ProviderOptions } from './types';

/**
 * Stitch the prose a model emitted across steps into one reply. DeepSeek tends to
 * write text alongside its tool calls and then again after the tool results, often
 * repeating its whole message verbatim. Dropping any step text that duplicates or
 * is contained in another collapses that back to a single clean reply, while still
 * keeping genuinely complementary halves (an acknowledgement then a question).
 * Empty steps are skipped, so a reply that only appears in the tool step survives.
 */
function assembleReply(stepTexts: string[]): string {
  const parts: string[] = [];
  for (const raw of stepTexts) {
    const t = raw.trim();
    if (!t) continue;
    if (parts.some((p) => p.includes(t))) continue; // already covered by a kept part
    const idx = parts.findIndex((p) => t.includes(p)); // this part supersedes a smaller one
    if (idx >= 0) parts[idx] = t;
    else parts.push(t);
  }
  return applyReplacements(parts.join(' ')).trim();
}

export interface CreateAgentOptions<TTools extends ToolSet> {
  /** Language model instance used to run the turn. */
  model: LanguageModel;
  /** Builds the system prompt from the per-turn context. Knowledge JSON should be closed over at construction time. */
  buildSystem: (context: Record<string, unknown>) => string;
  /** Optional tool set. Omit for a pure Q&A agent that never calls tools. */
  tools?: TTools;
  /** Provider-specific options forwarded to streamText. e.g. { openrouter: { reasoning: { enabled: false } } } */
  providerOptions?: ProviderOptions;
  /** Sampling temperature. Default 0.5. */
  temperature?: number;
  /**
   * Step budget for the turn. Default stepCountIs(2). The model spreads one reply
   * across steps (prose alongside its tool calls, then a follow-up after the tool
   * results), so give it enough steps to finish - e.g. stepCountIs(5) for a
   * tool-heavy intake turn (ack -> tools -> question).
   */
  stopWhen?: ReturnType<typeof stepCountIs>;
  /**
   * When true, hold the model's prose instead of streaming it live: collect the
   * text from every step, de-duplicate it (see `assembleReply`), and emit it once
   * after the tool parts. Set this for tool-heavy, multi-step turns where the model
   * tends to repeat its whole reply across steps (e.g. DeepSeek on intake). Costs
   * the live "typing" effect, so leave it off (default) for plain Q&A agents that
   * answer in a single step and benefit from streaming. Default false.
   */
  coalesceReply?: boolean;
  /** Prefix for error logs so multi-agent Cloudflare logs stay readable. Default '[agent-core]'. */
  logTag?: string;
}

/**
 * Build a streaming chat agent that takes UIMessages + context and returns a UI
 * message stream Response. The factory is transport-agnostic: drop the returned
 * Response into a Workers / Next.js / Express handler. The caller layers on
 * auth, CORS, and rate-limits.
 *
 * One streaming call per turn. By default the reply streams straight through,
 * typing out live - right for single-step Q&A. With `coalesceReply` (for
 * tool-heavy, multi-step turns) the tool parts still stream live but the prose is
 * held: the model may emit text across several steps and repeat itself, so the
 * per-step prose is collected, de-duplicated (see `assembleReply`), and emitted
 * once - no second pass, no doubled text, no empty-reply gap. Give `stopWhen`
 * enough steps to finish.
 *
 * Sanitization (em-dash, smart quotes, ellipsis) is applied to streamed text via
 * `experimental_transform`, and to the assembled tool-path reply via
 * `applyReplacements`. Tool argument sanitization happens at execute time inside
 * each tool definition.
 */
export function createAgent<TTools extends ToolSet>(opts: CreateAgentOptions<TTools>) {
  const {
    model,
    buildSystem,
    tools,
    providerOptions,
    temperature = 0.5,
    stopWhen = stepCountIs(2),
    coalesceReply = false,
    logTag = '[agent-core]',
  } = opts;

  return {
    async respond({ messages, context = {} }: AgentRespondInput): Promise<Response> {
      const modelMessages = await convertToModelMessages(messages);
      const system = buildSystem(context);

      const stream = createUIMessageStream({
        async execute({ writer }) {
          const prose = streamText({
            model,
            system,
            messages: modelMessages,
            tools,
            stopWhen,
            temperature,
            experimental_transform: sanitizeOutputTransform<TTools>(),
            providerOptions,
            onError({ error }) {
              console.error(`${logTag} stream error:`, error);
            },
          });

          if (!coalesceReply) {
            // Stream everything straight through so the reply types out live. Right
            // for single-step turns (plain Q&A) with no risk of cross-step repeats.
            writer.merge(prose.toUIMessageStream({ sendStart: false, sendFinish: false }));
            await prose.text;
            return;
          }

          // Coalesced path: forward tool parts live (they drive chips / snapshot /
          // form state), but hold back the prose. The model often repeats its whole
          // reply across steps; streaming each copy would double it. We collect the
          // prose from every step, de-duplicate it, and emit it once at the end.
          const reader = prose
            .toUIMessageStream({ sendStart: false, sendFinish: false })
            .getReader();
          try {
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              const type = (value as { type?: unknown }).type;
              const isProse =
                typeof type === 'string' &&
                (type.startsWith('text') || type.startsWith('reasoning'));
              if (!isProse) writer.write(value as Parameters<typeof writer.write>[0]);
            }
          } finally {
            reader.releaseLock();
          }

          const steps = await prose.steps;
          const reply = assembleReply(steps.map((s) => s.text ?? ''));
          if (reply) {
            const id = 'reply';
            writer.write({ type: 'text-start', id });
            writer.write({ type: 'text-delta', id, delta: reply });
            writer.write({ type: 'text-end', id });
          }
        },
        onError: (error) => {
          console.error(`${logTag} ui stream error:`, error);
          return 'The assistant hit an error.';
        },
      });

      return createUIMessageStreamResponse({ stream });
    },
  };
}

export type Agent = ReturnType<typeof createAgent>;
