export type { ContactRequest, ContactResponse } from '@agentsox/contracts';

export interface Env {
  API_RATE_LIMITER?: RateLimit;
  SITE_ID?: string;
  ALLOWED_ORIGINS?: string;
  RESEND_API_KEY?: string;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
  CONTACT_FROM_NAME?: string;
}
