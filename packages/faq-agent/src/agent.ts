import { createAgent, type ProviderOptions } from '@agentsox/agent-core';
import type { LanguageModel } from 'ai';
import { type FaqClientConfig } from './config';
import { buildFaqSystemPrompt } from './prompts';
import { buildFaqTools } from './tools';

export interface FaqAgentOptions {
  /** Language model instance used to run the turn. */
  model: LanguageModel;
  /**
   * The client to serve: brand identity, FAQ knowledge, handoff wording. Must be a
   * config built (and so validated) with `defineFaqClient` - validation happens
   * once at definition time, not on every request.
   */
  client: FaqClientConfig;
  /** Provider-specific options forwarded to streamText. e.g. { openrouter: { reasoning: { enabled: false } } } */
  providerOptions?: ProviderOptions;
  /**
   * Sampling temperature. Precedence: this arg -> client.ai.temperature -> 0.5
   * (factual but with enough room to sound human, not clipped).
   */
  temperature?: number;
}

/**
 * Build a FAQ agent for one client. Owns the FAQ persona, the openIntake / setChips
 * tools, and the FAQ knowledge - all driven by the injected `client` config. Wiring
 * and sanitization come from `@agentsox/agent-core`; the model and transport are the
 * caller's to provide.
 *
 * The config is trusted here (already validated by `defineFaqClient`), so this is
 * cheap to call per request.
 *
 * @example
 *   import { createFaqAgent, defineFaqClient } from '@agentsox/faq-agent';
 *   const acme = defineFaqClient({ id: 'acme', identity: {...}, knowledge: {...}, origins: [...] });
 *   const agent = createFaqAgent({ model: openrouter('deepseek/deepseek-v4-flash'), client: acme });
 *   const response = await agent.respond({ messages });
 */
export function createFaqAgent(opts: FaqAgentOptions) {
  const { client } = opts;

  return createAgent({
    model: opts.model,
    buildSystem: () => buildFaqSystemPrompt(client),
    tools: buildFaqTools(client),
    providerOptions: opts.providerOptions,
    temperature: opts.temperature ?? client.ai?.temperature ?? 0.5,
    logTag: `[faq-agent:${client.id}]`,
  });
}

export type FaqAgent = ReturnType<typeof createFaqAgent>;
