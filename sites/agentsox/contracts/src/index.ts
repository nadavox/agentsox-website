export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ProjectContext {
  challenge?: string;
  businessType?: string;
  currentProcess?: string;
  currentTools?: string;
  desiredOutcome?: string;
  unknowns?: string[];
  opportunity?: string;
  suggestedFirstStep?: string;
  summary?: string;
}

export type IntakeContext = ProjectContext;

export interface IntakeRequest {
  siteId?: string;
  context?: ProjectContext;
  messages?: ChatMessage[];
}

export interface IntakeResponse {
  reply: string;
  context: ProjectContext;
  chips?: string[];
  readyToContact: boolean;
  contactSummary?: string;
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
