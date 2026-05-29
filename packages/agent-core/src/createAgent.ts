import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type LanguageModel,
  type ToolSet,
} from 'ai';
import { sanitizeOutputTransform } from './sanitize';
import type { AgentRespondInput, ProviderOptions } from './types';

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
  /** Step budget for the single-pass path. Default stepCountIs(2): step 1 may emit tool calls, step 2 streams the prose continuation. */
  stopWhen?: ReturnType<typeof stepCountIs>;
  /**
   * When true (and `tools` is set), split each turn into a silent tool pass followed
   * by a separate text pass. The tool pass runs the tools and forwards only their
   * parts; the text pass runs with tools off and streams the single visible reply.
   * This guarantees the reply is generated exactly once even when the model emits
   * text alongside its tool calls (a known DeepSeek / multi-step quirk that otherwise
   * produces duplicated text). Costs one extra model round-trip. Default false.
   */
  splitToolAndText?: boolean;
  /** Prefix for error logs so multi-agent Cloudflare logs stay readable. Default '[agent-core]'. */
  logTag?: string;
}

/** True for UI-message-stream chunks that carry model prose (text / reasoning). */
function isTextChunk(chunk: unknown): boolean {
  const type = (chunk as { type?: unknown }).type;
  return typeof type === 'string' && (type.startsWith('text') || type.startsWith('reasoning'));
}

/**
 * Build a streaming chat agent that takes UIMessages + context and returns a UI
 * message stream Response. The factory is transport-agnostic: drop the returned
 * Response into a Workers / Next.js / Express handler. The caller layers on
 * auth, CORS, and rate-limits.
 *
 * Two execution modes:
 *   single-pass (default): one streamText, step 1 may emit tool calls, step 2
 *     streams the prose continuation.
 *   split (splitToolAndText): a silent tool pass then a tools-off text pass, so
 *     the visible reply is emitted exactly once. See `splitToolAndText`.
 *
 * Sanitization (em-dash, smart quotes, ellipsis) is applied to text deltas via
 * `experimental_transform`. Tool argument sanitization happens at execute time
 * inside each tool definition.
 */
export function createAgent<TTools extends ToolSet>(opts: CreateAgentOptions<TTools>) {
  const {
    model,
    buildSystem,
    tools,
    providerOptions,
    temperature = 0.5,
    stopWhen = stepCountIs(2),
    splitToolAndText = false,
    logTag = '[agent-core]',
  } = opts;

  return {
    async respond({ messages, context = {} }: AgentRespondInput): Promise<Response> {
      const modelMessages = await convertToModelMessages(messages);
      const system = buildSystem(context);

      const stream = createUIMessageStream({
        async execute({ writer }) {
          // Pump a UI-message stream into the writer, optionally dropping prose chunks.
          const drain = async (uiStream: ReadableStream<unknown>, dropText: boolean) => {
            const reader = uiStream.getReader();
            try {
              for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                if (dropText && isTextChunk(value)) continue;
                writer.write(value as Parameters<typeof writer.write>[0]);
              }
            } finally {
              reader.releaseLock();
            }
          };

          if (splitToolAndText && tools) {
            // Pass 1 - tools only. Let the model run its full tool sequence (it often
            // calls a "ready" tool in a second step, after seeing the first tool's
            // result), forwarding the tool parts and dropping all prose.
            const toolPass = streamText({
              model,
              system,
              messages: modelMessages,
              tools,
              stopWhen,
              temperature,
              providerOptions,
              onError({ error }) {
                console.error(`${logTag} tool pass error:`, error);
              },
            });
            await drain(toolPass.toUIMessageStream({ sendStart: false, sendFinish: false }), true);

            const toolCalls = await toolPass.toolCalls;
            const captured = toolCalls.map((call) => ({
              tool: call.toolName,
              input: (call as { input?: unknown }).input,
            }));
            const readyFired = toolCalls.some((call) => call.toolName === 'markReadyToContact');

            // Pass 2 - text only. Reply to the visitor's latest message, informed by what
            // was just captured. Feeding the facts as context (rather than continuing
            // after a dangling tool result) keeps the model from going silent. Tools are
            // off so it cannot think out loud or call again.
            let textSystem = system;
            if (captured.length) {
              textSystem += `

You just privately recorded these details from the visitor's latest message: ${JSON.stringify(captured)}. Do not repeat them back verbatim and do not mention that you saved anything.`;
            }
            textSystem += `

Now write your single reply to the visitor in your normal voice - 2-3 short sentences. Always write a reply; never stay silent. Never mention tools, the snapshot, or internal steps.`;
            if (readyFired) {
              textSystem += ` You have enough to move forward now: briefly reflect what they want and point them to the form on the right (name + email) as the next step. Do not ask another question.`;
            }

            const textPass = streamText({
              model,
              system: textSystem,
              messages: modelMessages,
              temperature,
              experimental_transform: sanitizeOutputTransform<TTools>(),
              providerOptions,
              onError({ error }) {
                console.error(`${logTag} text pass error:`, error);
              },
            });
            await drain(textPass.toUIMessageStream({ sendStart: false, sendFinish: false }), false);

            // Safety net: small models occasionally return no text after a "final" tool
            // call, which would leave a blank bubble. If the text pass produced nothing,
            // emit a deterministic fallback so the visitor always gets a reply. A visible
            // fallback is the documented handling - never silently drop the turn.
            const replyText = (await textPass.text).trim();
            if (!replyText) {
              const fallback = readyFired
                ? "Got what I need for now - add your name and email on the right and we'll come back with a first step."
                : "Tell me a bit more about what you're running into and we'll work out the first step together.";
              const id = 'fallback-reply';
              const write = (chunk: unknown) => writer.write(chunk as Parameters<typeof writer.write>[0]);
              write({ type: 'text-start', id });
              write({ type: 'text-delta', id, delta: fallback });
              write({ type: 'text-end', id });
            }
            return;
          }

          // Single-pass: step 1 may emit tool calls, step 2 streams the prose continuation.
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
              console.error(`${logTag} prose stream error:`, error);
            },
          });

          writer.merge(prose.toUIMessageStream({ sendStart: false, sendFinish: false }));

          await prose.text;
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
