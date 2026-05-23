export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface IntakeContext {
  problem?: string;
  businessType?: string;
  tools?: string;
  details?: string;
  summary?: string;
}

export interface IntakeRequest {
  siteId?: string;
  context?: IntakeContext;
  messages?: ChatMessage[];
}

export interface IntakeResponse {
  reply: string;
  context: IntakeContext;
  options?: string[];
  renderOptions?: boolean;
  optionType?: 'problem_category' | 'business_type' | 'success_goal';
  leadReady: boolean;
}

export interface ContactRequest {
  siteId?: string;
  name?: string;
  email?: string;
  message?: string;
  source?: string;
}

export interface ContactResponse {
  ok: true;
  requestId: string;
  messageId?: string;
}

export interface Env {
  AI: Ai;
  API_RATE_LIMITER?: RateLimit;
  SITE_ID?: string;
  MODEL_PROVIDER?: 'workers-ai' | 'local-preview';
  WORKERS_AI_MODEL?: string;
  ALLOWED_ORIGINS?: string;
  RESEND_API_KEY?: string;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
  CONTACT_FROM_NAME?: string;
}
