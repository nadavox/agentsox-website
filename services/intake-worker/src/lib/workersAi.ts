import {
  BUSINESS_OPTIONS,
  FIRST_OPTIONS,
  isGreetingOrTooVague,
  isMetaHelpQuestion,
  looksLikeWorkflowProblem,
  localPreviewReply,
  sanitizeMessages,
  SUCCESS_GOAL_OPTIONS,
  SYSTEM_PROMPT,
} from '../bots/agentsox';
import knowledge from '../data/agentsoxKnowledge.json';
import type { Env, IntakeContext, IntakeResponse, ChatMessage } from '../types';

interface WorkersAiTextResult {
  response?: string;
  result?: {
    response?: string;
  };
}

function parseJsonObject(text: string): Partial<IntakeResponse> | null {
  const trimmed = text.trim();
  const jsonStart = trimmed.indexOf('{');
  const jsonEnd = trimmed.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) return null;

  try {
    return JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as Partial<IntakeResponse>;
  } catch {
    return null;
  }
}

function normalizeAiResponse(data: Partial<IntakeResponse>, fallback: IntakeResponse): IntakeResponse {
  const optionType = data.optionType || fallback.optionType;
  const validOptionsByType = {
    problem_category: FIRST_OPTIONS,
    business_type: BUSINESS_OPTIONS,
    success_goal: SUCCESS_GOAL_OPTIONS,
  };
  const allowedOptions = optionType ? validOptionsByType[optionType] : [];
  const rawOptions = Array.isArray(data.options) ? data.options : fallback.options || [];
  const options = rawOptions.filter((option) => allowedOptions.includes(option)).slice(0, 6);
  const renderOptions = Boolean(data.renderOptions ?? fallback.renderOptions) && options.length > 0;

  return {
    reply: typeof data.reply === 'string' && data.reply.trim() ? data.reply.trim() : fallback.reply,
    context: {
      ...fallback.context,
      ...(data.context && typeof data.context === 'object' ? data.context : {}),
    },
    options: renderOptions ? options : [],
    renderOptions,
    optionType: renderOptions ? optionType : undefined,
    leadReady: typeof data.leadReady === 'boolean' ? data.leadReady : fallback.leadReady,
  };
}

export async function runWorkersAi(
  env: Env,
  messages: ChatMessage[],
  context: IntakeContext,
): Promise<IntakeResponse> {
  const sanitizedMessages = sanitizeMessages(messages);
  const lastUserMessage = sanitizedMessages.at(-1)?.content || '';
  const fallback = localPreviewReply(lastUserMessage, context);
  const model = env.WORKERS_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct-awq';

  if (!context.problem && (
    isGreetingOrTooVague(lastUserMessage) ||
    isMetaHelpQuestion(lastUserMessage) ||
    !looksLikeWorkflowProblem(lastUserMessage)
  )) {
    return fallback;
  }

  const result = await env.AI.run(model, {
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'system',
        content: `AgentsOX knowledge base JSON: ${JSON.stringify(knowledge)}`,
      },
      {
        role: 'system',
        content: `Current known context as JSON: ${JSON.stringify(context || {})}`,
      },
      ...sanitizedMessages,
    ],
    max_tokens: 360,
    temperature: 0.1,
  }) as WorkersAiTextResult | string;

  const text =
    typeof result === 'string'
      ? result
      : result.response || result.result?.response || JSON.stringify(result);

  const parsed = parseJsonObject(text);
  if (!parsed) return fallback;

  return normalizeAiResponse(parsed, fallback);
}
