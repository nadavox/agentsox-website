import type { streamText, UIMessage } from 'ai';

/**
 * Convenience alias so callers don't repeat the gnarly extraction inline.
 */
export type ProviderOptions = NonNullable<Parameters<typeof streamText>[0]['providerOptions']>;

export interface AgentRespondInput {
  /** UIMessage array as produced by `@ai-sdk/react`'s useChat. */
  messages: UIMessage[];
  /** Per-turn context object inlined into the system prompt. */
  context?: Record<string, unknown>;
}
