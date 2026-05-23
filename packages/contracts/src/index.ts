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
