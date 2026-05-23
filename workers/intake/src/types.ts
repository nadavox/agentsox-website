export type {
  ChatMessage,
  ChatRole,
  IntakeContext,
  IntakeRequest,
  IntakeResponse,
} from '@agentsox/contracts';

export interface Env {
  AI: Ai;
  API_RATE_LIMITER?: RateLimit;
  SITE_ID?: string;
  MODEL_PROVIDER?: 'workers-ai' | 'local-preview';
  WORKERS_AI_MODEL?: string;
  ALLOWED_ORIGINS?: string;
  CONTACT_ENDPOINT?: string;
}
