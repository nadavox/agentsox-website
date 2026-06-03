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

/** Jaccard word-set similarity, used to spot near-duplicate sentences. */
function sentenceSimilarity(a: string, b: string): number {
  const words = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean),
    );
  const wa = words(a);
  const wb = words(b);
  if (wa.size === 0 || wb.size === 0) return 0;
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter += 1;
  return inter / (wa.size + wb.size - inter);
}

/**
 * Collapse a sentence that restarts itself, e.g.
 * "What booking system are you using now What booking system are you using?"
 * -> "What booking system are you using now?". This happens when the model emits
 * the trailing question, gets cut at a step boundary, then re-emits it: the two
 * copies get joined into one run-on with no punctuation between them. We look for
 * the sentence's own leading phrase (>= 5 words) recurring after a tiny gap and,
 * if found, keep only the second (usually complete, punctuated) copy onward.
 */
function collapseInternalRepeat(sentence: string): string {
  const words = sentence.split(/\s+/).filter(Boolean);
  const norm = words.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const n = words.length;
  // 5 words + a single-word gap keeps this tight to the real failure (a restarted
  // trailing question) and avoids collapsing legitimately repeated short clauses
  // like "you can book online, and you can book online or by phone".
  const MIN_PHRASE = 5;
  const MAX_GAP = 1; // words allowed between the two copies of the leading phrase
  for (let len = Math.floor(n / 2); len >= MIN_PHRASE; len -= 1) {
    for (let k = len; k <= len + MAX_GAP && k + len <= n; k += 1) {
      let match = true;
      for (let i = 0; i < len; i += 1) {
        if (norm[i] !== norm[k + i]) {
          match = false;
          break;
        }
      }
      if (match) return words.slice(k).join(' ');
    }
  }
  return sentence;
}

/**
 * Drop sentences the model repeated across steps. Exact whole-step repeats are
 * already removed by the containment pass in `assembleReply`; this catches the
 * near-duplicates it misses - a trailing sentence re-emitted with a word changed
 * or its punctuation dropped. Splits on blank-line paragraph breaks and keeps them
 * verbatim so formatting survives; within each paragraph it collapses self-restarts
 * (see `collapseInternalRepeat`) and drops any sentence that closely matches one
 * already kept anywhere in the reply.
 */
function dedupeSentences(text: string): string {
  const NEAR_DUP = 0.8;
  const kept: string[] = []; // normalized-enough sentences kept across the whole reply
  // Even indices are content blocks; odd indices are the "\n\n+" separators.
  const blocks = text.split(/(\n{2,})/);
  const out = blocks.map((block, idx) => {
    if (idx % 2 === 1 || !block.trim()) return block; // separator or blank, keep verbatim
    // Split on sentence-ending punctuation, but only when the next chunk starts a
    // new sentence (uppercase / digit / quote) - so "e.g. Shopify" and "i.e. the"
    // aren't chopped into fragments.
    const sentences = block.split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/).filter((s) => s.trim());
    const survivors: string[] = [];
    for (const raw of sentences) {
      const s = collapseInternalRepeat(raw.trim());
      if (!s) continue;
      if (kept.some((k) => sentenceSimilarity(k, s) >= NEAR_DUP)) continue;
      kept.push(s);
      survivors.push(s);
    }
    return survivors.join(' ');
  });
  // Tidy separators left dangling if a block emptied out.
  return out.join('').replace(/\n{2,}\s*$/, '').replace(/^\s*\n{2,}/, '').trim();
}

/**
 * Stitch the prose a model emitted across steps into one reply. DeepSeek tends to
 * write text alongside its tool calls and then again after the tool results, often
 * repeating its whole message. Pass 1 drops any step text that duplicates or is
 * contained in another (collapsing verbatim repeats) while keeping genuinely
 * complementary halves (an acknowledgement then a question); empty steps are
 * skipped so a reply that only appears in the tool step survives. Pass 2
 * (`dedupeSentences`) then removes the near-duplicate / restarted sentences that
 * exact containment can't see - the trailing question repeated with a word changed
 * or its "?" dropped.
 */
export function assembleReply(stepTexts: string[]): string {
  const parts: string[] = [];
  for (const raw of stepTexts) {
    const t = raw.trim();
    if (!t) continue;
    if (parts.some((p) => p.includes(t))) continue; // already covered by a kept part
    const idx = parts.findIndex((p) => t.includes(p)); // this part supersedes a smaller one
    if (idx >= 0) parts[idx] = t;
    else parts.push(t);
  }
  return applyReplacements(dedupeSentences(parts.join(' '))).trim();
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
