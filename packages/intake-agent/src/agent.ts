import { createAgent, type ProviderOptions } from '@agentsox/agent-core';
import { stepCountIs, type LanguageModel } from 'ai';
import knowledge from './knowledge/agentsox.json';
import { STREAMING_SYSTEM_PROMPT } from './prompts';
import { intakeTools } from './tools';

export interface IntakeAgentOptions {
  /** Language model instance used to run the turn. */
  model: LanguageModel;
  /** Provider-specific options forwarded to streamText. e.g. { openrouter: { reasoning: { enabled: false } } } */
  providerOptions?: ProviderOptions;
  /** Sampling temperature. Default 0.5. */
  temperature?: number;
}

/**
 * Build the intake-pass system message: the AgentsOX style guide + the current snapshot
 * + the static knowledge JSON (services, process, audience, trust principles).
 */
function buildIntakeSystem(context: Record<string, unknown>): string {
  return `${STREAMING_SYSTEM_PROMPT}

Current project snapshot (private - don't quote it back to the visitor):
${JSON.stringify(context)}

AgentsOX knowledge base (draw on it only when relevant):
${JSON.stringify(knowledge)}`;
}

/**
 * The reusable AgentsOX intake agent. Owns the intake-specific system prompt,
 * the snapshot-filling tools (updateSnapshot, setChips, markReadyToContact),
 * and the services/process knowledge slice. Wiring + sanitization come from
 * `@agentsox/agent-core`.
 *
 * @example
 *   import { createIntakeAgent } from '@agentsox/intake-agent';
 *   const agent = createIntakeAgent({ model: openrouter('deepseek/deepseek-v4-flash') });
 *   const response = await agent.respond({ messages, context });
 */
export function createIntakeAgent(opts: IntakeAgentOptions) {
  return createAgent({
    model: opts.model,
    buildSystem: buildIntakeSystem,
    tools: intakeTools,
    providerOptions: opts.providerOptions,
    temperature: opts.temperature,
    // One streaming call per turn, with room for the model to finish across steps
    // (ack -> tools -> question). DeepSeek tends to repeat its whole reply across
    // those steps, so coalesceReply collects the per-step prose, de-duplicates it,
    // and emits the reply once - no second pass, no doubled text, no empty-reply gap.
    stopWhen: stepCountIs(5),
    coalesceReply: true,
    logTag: '[intake-agent]',
  });
}

export type IntakeAgent = ReturnType<typeof createIntakeAgent>;
