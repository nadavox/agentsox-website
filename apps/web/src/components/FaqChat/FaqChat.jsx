import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Button as MantineButton,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { messageText, useFaqChat } from './useFaqChat';
import './FaqChat.css';

const FAQ_GREETING = [
  {
    id: 'faq-greeting',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: "Questions about how we work, what we build, or what a project looks like? Ask away - and if it turns into a real project, I'll point you to the intake.",
      },
    ],
  },
];

const SITE_ID = 'agentsox-main';
const ENDPOINT =
  import.meta.env.VITE_FAQ_BOT_ENDPOINT ?? 'http://127.0.0.1:8789/api/chat';

/**
 * Floating FAQ assistant. Collapsed = circular button at bottom-right.
 * Expanded = small chat panel (desktop) or bottom sheet (mobile).
 */
export default function FaqChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const viewportRef = useRef(null);

  const { messages, sendMessage, status, error, chips, intakeCtas, reset } = useFaqChat({
    endpoint: ENDPOINT,
    siteId: SITE_ID,
    initialMessages: FAQ_GREETING,
  });

  const loading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    if (!isOpen) return undefined;
    const viewport = viewportRef.current;
    if (!viewport) return undefined;
    const scrollToBottom = () => {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    };
    const frame = requestAnimationFrame(scrollToBottom);
    const timeout = window.setTimeout(scrollToBottom, 80);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [messages, loading, isOpen]);

  function handleSend(value) {
    const text = value.trim();
    if (!text || loading) return;
    setInput('');
    sendMessage({ text });
  }

  function handleSubmit(e) {
    e.preventDefault();
    handleSend(input);
  }

  function handleOpenIntake(reason) {
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem('agentsox-handoff-reason', reason);
      } catch {
        /* ignore quota */
      }
      const target = document.getElementById('contact');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  }

  function handleReset() {
    setInput('');
    reset();
  }

  const latestAssistantIndex = messages.findLastIndex((m) => m.role === 'assistant');

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="faq-launcher"
            type="button"
            className="faq-chat__launcher"
            onClick={() => setIsOpen(true)}
            aria-label="Open AgentsOX FAQ assistant"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="faq-panel"
            className="faq-chat__panel"
            role="dialog"
            aria-label="AgentsOX FAQ assistant"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.18 }}
          >
            <header className="faq-chat__header">
              <div>
                <h3 className="faq-chat__title">AgentsOX FAQ</h3>
                <p className="faq-chat__subtitle">Quick answers about what we build.</p>
              </div>
              <Group gap="xs" wrap="nowrap">
                <MantineButton
                  type="button"
                  variant="subtle"
                  size="xs"
                  className="faq-chat__reset"
                  onClick={handleReset}
                >
                  Reset
                </MantineButton>
                <button
                  type="button"
                  className="faq-chat__close"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close FAQ assistant"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </Group>
            </header>

            <ScrollArea.Autosize className="faq-chat__scroll" viewportRef={viewportRef}>
              <Stack gap="sm" className="faq-chat__messages">
                {messages.map((message, index) => {
                  const text = messageText(message);
                  const isLatestAssistant =
                    message.role === 'assistant' && index === latestAssistantIndex;
                  const messageChips = chips[message.id];
                  const cta = intakeCtas[message.id];
                  const isStreamingThis = isLatestAssistant && loading && !text;
                  return (
                    <Paper
                      key={message.id || `${message.role}-${index}`}
                      className={`faq-chat__message faq-chat__message--${message.role}`}
                    >
                      <Text>{text || (isStreamingThis ? 'Thinking…' : '')}</Text>
                      {cta && message.role === 'assistant' && (
                        <div className="faq-chat__cta">
                          <p className="faq-chat__cta-reason">{cta.reason}</p>
                          <button
                            type="button"
                            className="faq-chat__cta-button"
                            onClick={() => handleOpenIntake(cta.reason)}
                          >
                            Open project intake →
                          </button>
                        </div>
                      )}
                      {isLatestAssistant &&
                        Array.isArray(messageChips) &&
                        messageChips.length > 0 &&
                        !loading && (
                          <Group className="faq-chat__chips" gap="xs">
                            {messageChips.map((option) => (
                              <MantineButton
                                key={option}
                                type="button"
                                className="faq-chat__chip"
                                variant="outline"
                                size="xs"
                                radius="xl"
                                onClick={() => handleSend(option)}
                                disabled={loading}
                              >
                                {option}
                              </MantineButton>
                            ))}
                          </Group>
                        )}
                    </Paper>
                  );
                })}
                {loading &&
                  (latestAssistantIndex === -1 || messages[messages.length - 1]?.role === 'user') && (
                    <Paper className="faq-chat__message faq-chat__message--assistant">
                      <Text>Thinking…</Text>
                    </Paper>
                  )}
                {error && (
                  <Paper className="faq-chat__message faq-chat__message--assistant">
                    <Text>
                      The assistant hit an error. Try again, or email nadav@agentsox.com.
                    </Text>
                  </Paper>
                )}
              </Stack>
            </ScrollArea.Autosize>

            <form className="faq-chat__input-row" onSubmit={handleSubmit}>
              <TextInput
                className="faq-chat__input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                aria-label="Ask the AgentsOX FAQ assistant"
                name="faq-message"
                autoComplete="off"
                placeholder="Ask anything about AgentsOX…"
                disabled={loading}
              />
              <MantineButton
                type="submit"
                className="faq-chat__send"
                variant="outline"
                radius="xl"
                disabled={loading || !input.trim()}
              >
                Send
              </MantineButton>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
