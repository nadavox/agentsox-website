export type {
  ChatMessage,
  ChatRole,
  IntakeContext,
  IntakeRequest,
  IntakeResponse,
  ProjectContext,
} from '@agentsox/contracts';

export interface Env {
  AI: Ai;
  API_RATE_LIMITER?: RateLimit;
  SITE_ID?: string;
  MODEL_PROVIDER?: 'workers-ai' | 'local-preview';
  WORKERS_AI_MODEL?: string;
  ALLOWED_ORIGINS?: string;
  CONTACT_ENDPOINT?: string;
  OPENROUTER_API_KEY?: string;
}
