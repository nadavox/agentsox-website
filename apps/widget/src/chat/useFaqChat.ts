import { useChat } from '@ai-sdk/react';
import { createFaqTransport, extractToolUpdates, messageText } from '@agentsox/faq-client';
import type { FaqChips, FaqCtas } from '@agentsox/faq-client';
import type { UIMessage } from 'ai';
import { useEffect, useMemo, useRef, useState } from 'react';

// Re-export so ChatWidget keeps importing it from here.
export { messageText };

interface Options {
  endpoint: string;
  siteId: string;
  initialMessages: UIMessage[];
}

/**
 * Widget FAQ chat hook: wires the shared wire contract (@agentsox/faq-client) into
 * React state. Derives per-message `chips` / `intakeCtas` from streamed tool parts.
 * No persistence - a widget starts fresh each load.
 */
export function useFaqChat({ endpoint, siteId, initialMessages }: Options) {
  const [chips, setChips] = useState<FaqChips>({});
  const [intakeCtas, setIntakeCtas] = useState<FaqCtas>({});
  const processed = useRef<Set<string>>(new Set());

  const transport = useMemo(() => createFaqTransport({ endpoint, siteId }), [endpoint, siteId]);

  const { messages, sendMessage, setMessages, status, error } = useChat({
    id: `agentsox-faq-${siteId}`,
    messages: initialMessages,
    transport,
  });

  useEffect(() => {
    const { chips: nextChips, ctas: nextCtas } = extractToolUpdates(messages, processed.current);
    if (Object.keys(nextChips).length) setChips((prev) => ({ ...prev, ...nextChips }));
    if (Object.keys(nextCtas).length) setIntakeCtas((prev) => ({ ...prev, ...nextCtas }));
  }, [messages]);

  function reset() {
    setMessages(initialMessages);
    setChips({});
    setIntakeCtas({});
    processed.current = new Set();
  }

  return { messages, sendMessage, status, error, chips, intakeCtas, reset };
}
