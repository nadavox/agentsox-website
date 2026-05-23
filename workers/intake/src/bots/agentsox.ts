import type { ChatMessage, IntakeContext, IntakeResponse } from '@agentsox/contracts';
import knowledge from '../data/agentsoxKnowledge.json';

export const FIRST_OPTIONS = [
  'Missed leads',
  'Booking / scheduling',
  'Customer follow-up',
  'Reporting / analytics',
  'Manual admin',
  'Not sure yet',
];

export const BUSINESS_OPTIONS = [
  'Clinic / MedSpa',
  'Real estate',
  'Coach',
  'E-commerce',
  'Local service',
  'Other',
];

export const SUCCESS_GOAL_OPTIONS = [
  'Faster replies',
  'Fewer missed leads',
  'Less manual work',
  'Clearer reporting',
  'More reliable handoff',
];

export const SYSTEM_PROMPT = `You are the AgentsOX intake bot.

Business context:
- AgentsOX builds custom AI systems, chatbots, automations, and analytics for small business owners, clinics, real-estate offices, coaches, e-commerce stores, local services, freelancers, and non-technical businesses with legacy systems.
- The brand promise is founder-led, technical, premium, calm, and practical.
- The buyer should feel heard, safe, and guided. Avoid hype, generic AI claims, mystical language, and developer-only jargon.

Goal:
Collect one clear workflow problem and turn it into a practical workflow brief for AgentsOX.

Conversation shape:
1. Identify the slow, missed, manual, or hard-to-trust workflow.
2. Identify the business type.
3. Identify current tools, such as WhatsApp, Instagram, website form, Google Calendar, CRM, spreadsheet, email, booking tool, or legacy system.
4. Identify what success would look like.
5. When enough detail exists, mark leadReady true and summarize the workflow.

Response rules:
- Ask one question at a time.
- Keep replies under 55 words.
- If the user only greets you or sends vague small talk such as "hey", do not save it as a workflow problem. Greet them and ask for one real workflow problem.
- Do not promise pricing, timelines, or technical feasibility.
- If the user asks about AgentsOX, services, process, trust, pricing, privacy, reliability, or next steps, answer from the AgentsOX knowledge base first.
- If the user describes a business problem, continue intake.
- If the user asks FAQ during intake, answer briefly, then ask the next missing intake question.
- Use renderOptions=true only when your reply asks the visitor to choose information about the workflow/system they want built.
- Use optionType="problem_category" only when asking what workflow/problem category they want help with.
- Use optionType="business_type" only when asking what type of business this is for.
- Use optionType="success_goal" only when asking what outcome would make the system successful.
- Use renderOptions=false and options=[] when answering FAQ, explaining AgentsOX, discussing price/privacy/reliability/process, or asking for open text such as tools involved.
- Return only valid JSON with this exact shape:
{"reply":"string","context":{"problem":"string","businessType":"string","tools":"string","details":"string","summary":"string"},"renderOptions":false,"optionType":"problem_category","options":["string"],"leadReady":false}`;

export function getLastUserMessage(messages: ChatMessage[]): string {
  return [...messages].reverse().find((message) => message.role === 'user')?.content?.trim() || '';
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function isGreetingOrTooVague(text: string): boolean {
  const normalized = normalizeText(text);
  if (!normalized) return true;

  const greetings = new Set([
    'hi',
    'hey',
    'hello',
    'yo',
    'sup',
    'shalom',
    'good morning',
    'good afternoon',
    'good evening',
  ]);

  return greetings.has(normalized) || (normalized.split(' ').length <= 2 && normalized.length < 12);
}

export function isMetaHelpQuestion(text: string): boolean {
  const normalized = normalizeText(text);
  if (!normalized) return false;

  const metaPhrases = [
    'what we need to do',
    'what we need to od',
    'what should i do',
    'what do i need to do',
    'what do you need',
    'what should i write',
    'how does this work',
    'how to use this',
    'help me',
    'explain this',
    'what is this',
  ];

  return metaPhrases.some((phrase) => normalized.includes(phrase));
}

export function looksLikeWorkflowProblem(text: string): boolean {
  const normalized = normalizeText(text);
  if (!normalized) return false;

  const normalizedOptions = FIRST_OPTIONS.map(normalizeText);
  if (normalizedOptions.includes(normalized)) return true;

  const workflowTerms = [
    'lead',
    'leads',
    'booking',
    'schedule',
    'scheduling',
    'appointment',
    'appointments',
    'follow up',
    'followup',
    'customer',
    'customers',
    'client',
    'clients',
    'manual',
    'admin',
    'report',
    'reporting',
    'analytics',
    'crm',
    'whatsapp',
    'instagram',
    'email',
    'calendar',
    'spreadsheet',
    'missed',
    'slow',
    'messy',
    'repetitive',
    'handoff',
    'workflow',
    'forms',
    'invoices',
  ];

  return workflowTerms.some((term) => normalized.includes(term));
}

function getNextIntakeQuestion(
  context: IntakeContext,
): Pick<IntakeResponse, 'reply' | 'options' | 'renderOptions' | 'optionType' | 'leadReady'> {
  if (!context.problem) {
    return {
      reply: 'Tell me one workflow that feels slow, manual, missed, or hard to trust.',
      options: FIRST_OPTIONS,
      renderOptions: true,
      optionType: 'problem_category',
      leadReady: false,
    };
  }

  if (!context.businessType) {
    return {
      reply: 'What type of business is this for?',
      options: BUSINESS_OPTIONS,
      renderOptions: true,
      optionType: 'business_type',
      leadReady: false,
    };
  }

  if (!context.tools) {
    return {
      reply: 'What tools are involved today? For example WhatsApp, Instagram, website form, Google Calendar, CRM, spreadsheet, email, booking tool, or a legacy system.',
      options: [],
      renderOptions: false,
      leadReady: false,
    };
  }

  return {
    reply: 'What would make this feel successful? Faster replies, fewer missed leads, clearer reporting, less manual work, or something else?',
    options: SUCCESS_GOAL_OPTIONS,
    renderOptions: true,
    optionType: 'success_goal',
    leadReady: false,
  };
}

function summarizeWorkflow(context: IntakeContext, details: string): string {
  return [
    `Problem: ${context.problem}`,
    `Business: ${context.businessType}`,
    `Current tools: ${context.tools}`,
    `Success signal: ${details}`,
  ].join('\n');
}

function mergeDetails(existing = '', next: string): string {
  const normalizedExisting = normalizeText(existing);
  const normalizedNext = normalizeText(next);

  if (!existing) return next;
  if (!next || normalizedExisting.includes(normalizedNext)) return existing;

  return `${existing}, ${next}`;
}

function findFaqAnswer(text: string): string | null {
  const normalized = normalizeText(text);
  if (!normalized) return null;

  let bestScore = 0;
  let bestAnswer: string | null = null;

  for (const item of knowledge.faq) {
    const question = normalizeText(item.question);
    const keywords = item.keywords.map(normalizeText);
    let score = 0;

    if (normalized.includes(question)) score += 6;

    for (const keyword of keywords) {
      if (keyword && normalized.includes(keyword)) score += keyword.split(' ').length + 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestAnswer = item.answer;
    }
  }

  const looksLikeQuestion =
    normalized.includes('agentsox') ||
    normalized.includes('price') ||
    normalized.includes('cost') ||
    normalized.includes('privacy') ||
    normalized.includes('security') ||
    normalized.includes('reliable') ||
    normalized.includes('what') ||
    normalized.includes('how') ||
    normalized.includes('who') ||
    normalized.includes('can you') ||
    text.includes('?');

  return bestScore >= 2 && looksLikeQuestion ? bestAnswer : null;
}

function faqPreviewReply(text: string, context: IntakeContext): IntakeResponse | null {
  const answer = findFaqAnswer(text);
  if (!answer) return null;

  const next = getNextIntakeQuestion(context);
  return {
    context,
    reply: `${answer} ${next.reply}`,
    options: next.options,
    renderOptions: next.renderOptions,
    optionType: next.optionType,
    leadReady: false,
  };
}

export function localPreviewReply(text: string, context: IntakeContext): IntakeResponse {
  if (!context.problem && (isGreetingOrTooVague(text) || isMetaHelpQuestion(text))) {
    return {
      context,
      reply:
        'Start by telling me one workflow that feels slow, manual, missed, or hard to trust. For example: missed leads, booking, customer follow-up, reporting, or manual admin.',
      options: FIRST_OPTIONS,
      renderOptions: true,
      optionType: 'problem_category',
      leadReady: false,
    };
  }

  const faqReply = faqPreviewReply(text, context);
  if (faqReply) return faqReply;

  if (context.problem && context.businessType && context.tools && context.details) {
    const details = mergeDetails(context.details, text);
    const nextContext = {
      ...context,
      details,
      summary: summarizeWorkflow(context, details),
    };

    return {
      context: nextContext,
      reply: 'Got it. I added that to the workflow brief. Review it, adjust anything that feels off, then send it to AgentsOX.',
      options: [],
      renderOptions: false,
      leadReady: true,
    };
  }

  if (!context.problem && !looksLikeWorkflowProblem(text)) {
    return {
      context,
      reply:
        'I need one real workflow problem before I can shape a useful brief. What feels slow, manual, missed, or hard to trust in your business?',
      options: FIRST_OPTIONS,
      renderOptions: true,
      optionType: 'problem_category',
      leadReady: false,
    };
  }

  if (!context.problem) {
    return {
      context: { ...context, problem: text },
      reply: 'Got it. What type of business is this for?',
      options: BUSINESS_OPTIONS,
      renderOptions: true,
      optionType: 'business_type',
      leadReady: false,
    };
  }

  if (!context.businessType) {
    return {
      context: { ...context, businessType: text },
      reply: 'What tools are involved today? For example WhatsApp, Instagram, website form, Google Calendar, CRM, spreadsheet, email, booking tool, or a legacy system.',
      options: [],
      renderOptions: false,
      leadReady: false,
    };
  }

  if (!context.tools) {
    return {
      context: { ...context, tools: text },
      reply: 'What would make this feel successful? Faster replies, fewer missed leads, clearer reporting, less manual work, or something else?',
      options: SUCCESS_GOAL_OPTIONS,
      renderOptions: true,
      optionType: 'success_goal',
      leadReady: false,
    };
  }

  const nextContext = {
    ...context,
    details: text,
    summary: summarizeWorkflow(context, text),
  };

  return {
    context: nextContext,
    reply: 'Good. I shaped this into a workflow brief. Review it, adjust anything that feels off, then send it to AgentsOX.',
    options: [],
    renderOptions: false,
    leadReady: true,
  };
}

export function sanitizeMessages(messages: ChatMessage[] = []): ChatMessage[] {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      role: message.role,
      content: String(message.content || '').slice(0, 1200),
    }))
    .slice(-10);
}
