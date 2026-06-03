export { createFaqAgent } from './agent';
export type { FaqAgent, FaqAgentOptions } from './agent';
export { buildFaqTools } from './tools';
export type { FaqTools } from './tools';
export { buildFaqSystemPrompt } from './prompts';
export {
  defineFaqClient,
  defineFaqClientRegistry,
  faqClientSchema,
  handoffActive,
  chipsEnabled,
  publicWidgetConfig,
  FAQ_CONFIG_SCHEMA_VERSION,
} from './config';
export type {
  FaqClientConfig,
  FaqClientInput,
  PublicWidgetConfig,
  WidgetTheme,
} from './config';
