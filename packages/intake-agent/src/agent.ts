import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateObject,
  stepCountIs,
  streamText,
  type LanguageModel,
  type UIMessage,
} from 'ai';

type ProviderOptions = NonNullable<Parameters<typeof streamText>[0]['providerOptions']>;
import knowledge from './knowledge/agentsox.json';
import { SNAPSHOT_EXTRACTION_PROMPT, STREAMING_SYSTEM_PROMPT } from './prompts';
import { sanitizeArg, sanitizeOutputTransform } from './sanitize';
import { intakeTools, snapshotSchema } from './tools';

export interface IntakeAgentOptions {
  /** Language model instance used for both the prose stream and the snapshot extraction pass. */
  model: LanguageModel;
  /** Provider-specific options merged into both calls. e.g. { openrouter: { reasoning: {enabled: false} } } */
  providerOptions?: ProviderOptions;
  /** Prose-pass temperature. Default 0.5. */
  temperature?: number;
}

export interface IntakeRunInput {
  /** UIMessage array as produced by `@ai-sdk/react`'s useChat. */
  messages: UIMessage[];
  /** Current project snapshot the client has accumulated so far. Inlined into the system prompt. */
  context?: Record<string, unknown>;
}

/**
 * Build the prose-pass system message: the AgentsOX style guide + the current snapshot
 * + the static knowledge JSON.
 */
function buildProseSystem(context: Record<string, unknown>): string {
  return `${STREAMING_SYSTEM_PROMPT}

Current project snapshot (private - don't quote it back to the visitor):
${JSON.stringify(context)}

AgentsOX knowledge base (draw on it only when relevant):
${JSON.stringify(knowledge)}`;
}

/**
 * The reusable AgentsOX intake agent. Owns:
 *   - the system prompt + knowledge base + style rules
 *   - the optional tools (setChips, markReadyToContact)
 *   - the deterministic snapshot-extraction pass after the prose stream
 *   - typographic sanitization (em-dash, smart quotes, ellipsis)
 *
 * The host application provides the language model + transport. The agent has no
 * knowledge of Cloudflare Workers, Next.js, CORS, or rate-limits - drop it on any
 * stack that can call `streamText` and serve a `Response`.
 *
 * @example
 *   import { createIntakeAgent } from '@agentsox/intake-agent';
 *   const agent = createIntakeAgent({ model: openrouter('deepseek/deepseek-v4-flash') });
 *   const response = await agent.respond({ messages, context });
 */
export function createIntakeAgent(opts: IntakeAgentOptions) {
  const { model, providerOptions, temperature = 0.5 } = opts;

  return {
    /**
     * Run one turn and return a streaming Response in the AI SDK UI Message
     * protocol. Plug it directly into a Workers / Next.js / Express handler.
     *
     * The returned Response has no CORS or auth headers - the caller adds those.
     */
    async respond({ messages, context = {} }: IntakeRunInput): Promise<Response> {
      const modelMessages = await convertToModelMessages(messages);

      const stream = createUIMessageStream({
        async execute({ writer }) {
          // Pass 1: stream prose (and optional inline tool calls).
          const prose = streamText({
            model,
            system: buildProseSystem(context),
            messages: modelMessages,
            tools: intakeTools,
            // ONE step per turn - prevents the agent from looping after a tool call
            // and hallucinating a fake follow-up user turn.
            stopWhen: stepCountIs(1),
            temperature,
            experimental_transform: sanitizeOutputTransform<typeof intakeTools>(),
            providerOptions,
            onError({ error }) {
              console.error('[intake-agent] prose stream error:', error);
            },
          });

          writer.merge(prose.toUIMessageStream({ sendStart: false, sendFinish: false }));

          // Wait for prose so the extraction sees both sides of this turn.
          const proseText = await prose.text;

          // Pass 2: deterministic structured snapshot extraction. Even if the prose
          // model didn't surface snapshot info, this step always runs.
          try {
            const { object: snapshot } = await generateObject({
              model,
              schema: snapshotSchema,
              system: SNAPSHOT_EXTRACTION_PROMPT,
              messages: [
                ...modelMessages,
                { role: 'assistant', content: proseText },
              ],
              providerOptions,
            });

            const sanitized = sanitizeArg(snapshot);
            const hasAnyField = Object.values(sanitized).some(
              (v) => typeof v === 'string' && v.trim().length > 0,
            );

            if (hasAnyField) {
              const toolCallId = `snapshot_${Date.now()}`;
              // Surface as a synthetic tool call so existing useChat clients merge it.
              writer.write({
                type: 'tool-input-available',
                toolCallId,
                toolName: 'updateSnapshot',
                input: sanitized,
              });
              writer.write({
                type: 'tool-output-available',
                toolCallId,
                output: { ok: true, ...sanitized },
              });
            }
          } catch (error) {
            console.error('[intake-agent] snapshot extraction failed:', error);
            // Non-fatal - prose already streamed; we just don't fill the snapshot this turn.
          }
        },
        onError: (error) => {
          console.error('[intake-agent] ui stream error:', error);
          return 'The assistant hit an error.';
        },
      });

      return createUIMessageStreamResponse({ stream });
    },
  };
}

export type IntakeAgent = ReturnType<typeof createIntakeAgent>;
