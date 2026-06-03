export { createIntakeAgent } from './agent';
export type { IntakeAgent, IntakeAgentOptions } from './agent';
export { intakeTools, snapshotSchema } from './tools';
export type { IntakeTools, Snapshot } from './tools';
export { STREAMING_SYSTEM_PROMPT } from './prompts';
// Re-export sanitization helpers from agent-core so existing consumers
// (e.g. the intake-worker sanitize tests) keep working.
export { applyReplacements, sanitizeArg, sanitizeOutputTransform, assembleReply } from '@agentsox/agent-core';
