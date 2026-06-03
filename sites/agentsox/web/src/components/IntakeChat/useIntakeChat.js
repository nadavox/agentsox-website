import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

const STORAGE_KEY = 'agentsox-intake-chat-v1';
const PERSISTENCE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function loadPersisted() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.ts !== 'number' || Date.now() - parsed.ts > PERSISTENCE_TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function savePersisted(payload) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ts: Date.now(), ...payload }),
    );
  } catch {
    /* quota or unavailable - ignore */
  }
}

function clearPersisted() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function getToolPartName(part) {
  if (!part || typeof part.type !== 'string') return null;
  return part.type.startsWith('tool-') ? part.type.slice('tool-'.length) : null;
}

export function messageText(message) {
  // Kept identical to the FAQ widget's messageText: join distinct text parts with a
  // space so multi-part replies never smash words together. The intake bot coalesces
  // to a single part today, but this stays robust if that ever changes.
  return (message.parts || [])
    .filter((part) => part.type === 'text')
    .map((part) => (part.text || '').trim())
    .filter(Boolean)
    .join(' ');
}

/**
 * Wraps useChat with the AgentsOX intake protocol:
 * - sends siteId + current snapshot context as custom body fields
 * - watches assistant messages for our tool calls (updateSnapshot, setChips, markReadyToContact)
 * - merges tool output into local context / chips / ready state
 *
 * @param {object} options
 * @param {string} options.endpoint       POST endpoint that streams a UI message response
 * @param {string} options.siteId         site identifier sent in every request
 * @param {object} options.initialMessages initial UIMessage[] to seed the chat
 * @param {Record<string, string[]>} [options.initialChips] map of messageId -> chip list (for the seeded greeting)
 * @returns {{
 *   messages: import('ai').UIMessage[],
 *   sendMessage: ({text: string}) => void,
 *   reset: () => void,
 *   status: 'submitted' | 'streaming' | 'ready' | 'error',
 *   error: Error | undefined,
 *   context: object,
 *   chips: Record<string, string[]>,
 *   ready: boolean,
 * }}
 */
export function useIntakeChat({ endpoint, siteId, initialMessages, initialChips = {} }) {
  // Lazy-initialize all state from localStorage so a reload doesn't wipe an active conversation.
  // The initializer functions run once, never again, so ESLint can't flag them as render-time reads.
  const [startingMessages] = useState(() => {
    const persisted = loadPersisted();
    return persisted && Array.isArray(persisted.messages) && persisted.messages.length
      ? persisted.messages
      : initialMessages;
  });
  const [context, setContext] = useState(() => loadPersisted()?.context ?? {});
  const [chips, setChips] = useState(() => loadPersisted()?.chips ?? initialChips);
  const [ready, setReady] = useState(() => Boolean(loadPersisted()?.ready));

  const contextRef = useRef(context);
  useEffect(() => {
    contextRef.current = context;
  }, [context]);
  // Tool parts seen during prior sessions are already merged; mark them processed.
  const processedToolPartsRef = useRef(
    new Set(Array.isArray(loadPersisted()?.processedToolKeys) ? loadPersisted().processedToolKeys : []),
  );

  // contextRef.current is read at request time (inside prepareSendMessagesRequest, not at render).
  /* eslint-disable react-hooks/refs */
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: endpoint,
        prepareSendMessagesRequest: ({ messages: msgs }) => ({
          body: { siteId, context: contextRef.current, messages: msgs },
        }),
      }),
    [endpoint, siteId],
  );
  /* eslint-enable react-hooks/refs */

  const { messages, sendMessage, setMessages, status, error } = useChat({
    id: 'agentsox-intake',
    messages: startingMessages,
    transport,
  });

  useEffect(() => {
    let nextContext = null;
    let nextReady = null;
    const nextChips = {};

    for (const message of messages) {
      if (message.role !== 'assistant' || !Array.isArray(message.parts)) continue;
      for (let i = 0; i < message.parts.length; i += 1) {
        const part = message.parts[i];
        const toolName = getToolPartName(part);
        if (!toolName) continue;
        if (part.state !== 'output-available' && part.state !== 'input-available') continue;

        const key = `${message.id}:${i}`;
        if (processedToolPartsRef.current.has(key)) continue;
        processedToolPartsRef.current.add(key);

        const data =
          part.state === 'output-available' && part.output ? part.output : part.input || {};

        if (toolName === 'updateSnapshot') {
          nextContext = { ...(nextContext || contextRef.current) };
          for (const [k, v] of Object.entries(data)) {
            if (k === 'ok') continue;
            if (typeof v === 'string' && v.trim()) nextContext[k] = v.trim();
          }
        } else if (toolName === 'setChips' && Array.isArray(data.chips)) {
          nextChips[message.id] = data.chips.filter((c) => typeof c === 'string' && c.trim());
        } else if (toolName === 'markReadyToContact') {
          nextReady = true;
          if (typeof data.summary === 'string' && data.summary.trim()) {
            nextContext = {
              ...(nextContext || contextRef.current),
              summary: data.summary.trim(),
            };
          }
        }
      }
    }

    if (nextContext) setContext(nextContext);
    if (Object.keys(nextChips).length) setChips((prev) => ({ ...prev, ...nextChips }));
    if (nextReady === true) setReady(true);
  }, [messages]);

  // Deterministic "ready to send" gate. The moment the three core fields exist we
  // surface the send prompt and tell the model (via readyToSend in context) that it
  // has enough - we do NOT depend on the model deciding to close, and we never stop
  // the chat: the visitor can keep talking while the form sits ready.
  useEffect(() => {
    const c = context;
    const complete = Boolean(c.challenge && c.businessType && c.desiredOutcome);
    if (complete && !c.readyToSend) setContext((prev) => ({ ...prev, readyToSend: true }));
    if (complete && !ready) setReady(true);
  }, [context, ready]);

  // Persist on every meaningful state change (skip while streaming).
  useEffect(() => {
    if (status === 'streaming' || status === 'submitted') return;
    // Don't persist a fresh greeting-only state - leaves localStorage clean.
    const hasUserActivity = messages.some((m) => m.role === 'user');
    if (!hasUserActivity) {
      clearPersisted();
      return;
    }
    savePersisted({
      messages,
      context,
      chips,
      ready,
      processedToolKeys: Array.from(processedToolPartsRef.current),
    });
  }, [messages, context, chips, ready, status]);

  function reset() {
    setMessages(initialMessages);
    setContext({});
    setChips(initialChips);
    setReady(false);
    processedToolPartsRef.current = new Set();
    clearPersisted();
  }

  return { messages, sendMessage, status, error, context, chips, ready, reset };
}
