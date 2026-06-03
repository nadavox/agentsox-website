import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { createFaqTransport, extractToolUpdates, messageText } from '@agentsox/faq-client';

// The chat wire contract (transport, tool parsing, messageText) is shared with the
// embeddable widget via @agentsox/faq-client. This hook adds the site-only concern:
// sessionStorage persistence within a tab.
export { messageText };

const STORAGE_KEY = 'agentsox-faq-chat-v1';
// FAQ history lives in sessionStorage, not localStorage: it survives an accidental
// same-tab reload, but a fresh visit (new tab, or a closed-and-reopened browser)
// starts clean - so one visitor never inherits a previous visitor's conversation.
// The TTL is a short idle backstop within a single tab session.
const PERSISTENCE_TTL_MS = 60 * 60 * 1000; // 60 min idle

function loadPersisted() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.ts !== 'number' || Date.now() - parsed.ts > PERSISTENCE_TTL_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY);
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
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now(), ...payload }));
  } catch {
    /* ignore */
  }
}

function clearPersisted() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
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
    () => createFaqTransport({ endpoint, siteId }),
    [endpoint, siteId],
  );

  const { messages, sendMessage, setMessages, status, error } = useChat({
    id: 'agentsox-faq',
    messages: startingMessages,
    transport,
  });

  useEffect(() => {
    const { chips: nextChips, ctas: nextCtas } = extractToolUpdates(
      messages,
      processedToolPartsRef.current,
    );
    // Derive per-message chips / CTA slices from the streamed UIMessage parts.
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
