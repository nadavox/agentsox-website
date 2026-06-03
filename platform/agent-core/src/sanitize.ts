import type { StreamTextTransform, ToolSet } from 'ai';

/**
 * Replacements applied to every text-delta chunk and every tool call argument
 * before they reach the client. Prevents the model's typographic flourishes
 * (em-dash, en-dash, smart quotes, ellipsis) from leaking into the snapshot or prose.
 */
const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\s*[—–]\s*/g, ' - '],
  [/[‘’]/g, "'"],
  [/[“”]/g, '"'],
  [/…/g, '...'],
];

/**
 * Apply all string replacements to a single piece of text.
 */
export function applyReplacements(text: string): string {
  let out = text;
  for (const [re, rep] of REPLACEMENTS) out = out.replace(re, rep);
  return out;
}

/**
 * Recursively sanitize any value that may contain strings - safe for tool argument
 * objects and arrays. Non-string scalars pass through untouched.
 */
export function sanitizeArg<T>(value: T): T {
  if (typeof value === 'string') return applyReplacements(value) as T;
  if (Array.isArray(value)) return value.map((v) => sanitizeArg(v)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = sanitizeArg(v);
    return out as T;
  }
  return value;
}

/**
 * Stream transform factory for streamText that rewrites every text-delta chunk
 * with the same replacements. Tool call inputs bypass this and are sanitized at
 * execute time via sanitizeArg.
 */
export function sanitizeOutputTransform<T extends ToolSet>(): StreamTextTransform<T> {
  return () =>
    new TransformStream({
      transform(chunk, controller) {
        if (chunk.type === 'text-delta') {
          controller.enqueue({ ...chunk, text: applyReplacements(chunk.text) });
          return;
        }
        controller.enqueue(chunk);
      },
    });
}
