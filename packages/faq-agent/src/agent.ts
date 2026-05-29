import { createAgent, type ProviderOptions } from '@agentsox/agent-core';
import type { LanguageModel } from 'ai';
import knowledge from './knowledge/faq.json';
import { FAQ_SYSTEM_PROMPT } from './prompts';
import { faqTools } from './tools';

export interface FaqAgentOptions {
  /** Language model instance used to run the turn. */
  model: LanguageModel;
  /** Provider-specific options forwarded to streamText. e.g. { openrouter: { reasoning: { enabled: false } } } */
  providerOptions?: ProviderOptions;
  /** Sampling temperature. Default 0.5 - factual but with enough room to sound human, not clipped. */
  temperature?: number;
}

/**
 * Build the FAQ-pass system message: the FAQ persona + the FAQ knowledge JSON.
 * FAQ doesn't use the per-turn context object - the per-turn signal comes from
 * the chat history alone.
 */
function buildFaqSystem(_context: Record<string, unknown>): string {
  return `${FAQ_SYSTEM_PROMPT}

AgentsOX FAQ knowledge base:
${JSON.stringify(knowledge)}`;
}

/**
 * The reusable AgentsOX FAQ agent. Owns the FAQ-specific system prompt, the
 * openIntake / setChips tools, and the FAQ knowledge slice. Wiring +
 * sanitization come from `@agentsox/agent-core`.
 *
 * @example
 *   import { createFaqAgent } from '@agentsox/faq-agent';
 *   const agent = createFaqAgent({ model: openrouter('deepseek/deepseek-v4-flash') });
 *   const response = await agent.respond({ messages });
 */
export function createFaqAgent(opts: FaqAgentOptions) {
  return createAgent({
    model: opts.model,
    buildSystem: buildFaqSystem,
    tools: faqTools,
    providerOptions: opts.providerOptions,
    temperature: opts.temperature ?? 0.5,
    logTag: '[faq-agent]',
  });
}

export type FaqAgent = ReturnType<typeof createFaqAgent>;
