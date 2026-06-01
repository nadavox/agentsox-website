import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

const STORAGE_KEY = 'agentsox-faq-chat-v1';
const PERSISTENCE_TTL_MS = 24 * 60 * 60 * 1000;

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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now(), ...payload }));
  } catch {
    /* ignore */
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
  // The model can emit prose across steps (e.g. an answer, then a line after a tool
  // call), arriving as separate text parts. Joining with '' smashed them together
  // ("take a lookHead over..."); join distinct parts with a space so sentences stay
  // readable. Single-part replies (the common case) are unaffected.
  return (message.parts || [])
    .filter((part) => part.type === 'text')
    .map((part) => (part.text || '').trim())
    .filter(Boolean)
    .join(' ');
}

/**
 * Sibling of useIntakeChat for the FAQ widget. Simpler state:
 *   - messages (from useChat)
 *   - chips: { [messageId]: string[] } from `setChips` tool calls
 *   - intakeCtas: { [messageId]: { reason } } from `openIntake` tool calls
 *
 * No `context`, no `ready`, no snapshot - FAQ is stateless beyond chat history.
 *
 * @param {object} options
 * @param {string} options.endpoint
 * @param {string} options.siteId
 * @param {import('ai').UIMessage[]} options.initialMessages
 */
export function useFaqChat({ endpoint, siteId, initialMessages }) {
  const [startingMessages] = useState(() => {
    const persisted = loadPersisted();
    return persisted && Array.isArray(persisted.messages) && persisted.messages.length
      ? persisted.messages
      : initialMessages;
  });
  const [chips, setChips] = useState(() => loadPersisted()?.chips ?? {});
  const [intakeCtas, setIntakeCtas] = useState(() => loadPersisted()?.intakeCtas ?? {});
  const processedToolPartsRef = useRef(
    new Set(Array.isArray(loadPersisted()?.processedToolKeys) ? loadPersisted().processedToolKeys : []),
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: endpoint,
        prepareSendMessagesRequest: ({ messages: msgs }) => ({
          body: { siteId, messages: msgs },
        }),
      }),
    [endpoint, siteId],
  );

  const { messages, sendMessage, setMessages, status, error } = useChat({
    id: 'agentsox-faq',
    messages: startingMessages,
    transport,
  });

  useEffect(() => {
    const nextChips = {};
    const nextCtas = {};

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

        if (toolName === 'setChips' && Array.isArray(data.chips)) {
          nextChips[message.id] = data.chips.filter((c) => typeof c === 'string' && c.trim());
        } else if (toolName === 'openIntake' && typeof data.reason === 'string' && data.reason.trim()) {
          nextCtas[message.id] = { reason: data.reason.trim() };
        }
      }
    }

    // Same pattern as useIntakeChat's tool-watching effect: we derive per-message
    // state slices from the streamed UIMessage parts. Calling setState here is
    // intentional - useIntakeChat does the identical thing and lint accepts it
    // there but trips here, likely a quirk of the rule's flow analysis.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (Object.keys(nextChips).length) setChips((prev) => ({ ...prev, ...nextChips }));
    if (Object.keys(nextCtas).length) setIntakeCtas((prev) => ({ ...prev, ...nextCtas }));
  }, [messages]);

  useEffect(() => {
    if (status === 'streaming' || status === 'submitted') return;
    const hasUserActivity = messages.some((m) => m.role === 'user');
    if (!hasUserActivity) {
      clearPersisted();
      return;
    }
    savePersisted({
      messages,
      chips,
      intakeCtas,
      processedToolKeys: Array.from(processedToolPartsRef.current),
    });
  }, [messages, chips, intakeCtas, status]);

  function reset() {
    setMessages(initialMessages);
    setChips({});
    setIntakeCtas({});
    processedToolPartsRef.current = new Set();
    clearPersisted();
  }

  return { messages, sendMessage, status, error, chips, intakeCtas, reset };
}
