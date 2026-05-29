import { useEffect, useRef, useState } from 'react';
import {
  Button as MantineButton,
  Card,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { messageText, useIntakeChat } from './useIntakeChat';
import TypingDots from '../ui/TypingDots';

/**
 * AgentsOX intake chat card. Streams a project-clarification conversation,
 * captures tool-driven snapshot updates, surfaces quick-reply chips, and
 * notifies the parent on context / readyToContact changes.
 *
 * @param {object} props
 * @param {string} props.endpoint           streaming chat endpoint
 * @param {string} props.siteId             site identifier sent with every request
 * @param {import('ai').UIMessage[]} props.initialMessages
 * @param {Record<string, string[]>} [props.initialChips]
 * @param {(context: object) => void} [props.onContextChange]
 * @param {(ready: boolean) => void} [props.onReadyChange]
 */
export default function IntakeChat({
  endpoint,
  siteId,
  initialMessages,
  initialChips,
  onContextChange,
  onReadyChange,
  onReset,
}) {
  const [input, setInput] = useState('');
  const viewportRef = useRef(null);
  const pendingRef = useRef(null);

  const { messages, sendMessage, status, error, context, chips, ready, reset } = useIntakeChat({
    endpoint,
    siteId,
    initialMessages,
    initialChips,
  });

  const loading = status === 'submitted' || status === 'streaming';

  // Type-ahead: if the visitor sends while the bot is still replying, hold the
  // message and fire it the moment the turn finishes instead of dropping it.
  useEffect(() => {
    if (status === 'ready' && pendingRef.current) {
      const next = pendingRef.current;
      pendingRef.current = null;
      sendMessage({ text: next });
    }
  }, [status, sendMessage]);

  useEffect(() => {
    onContextChange?.(context);
  }, [context, onContextChange]);

  useEffect(() => {
    onReadyChange?.(ready);
  }, [onReadyChange, ready]);

  useEffect(() => {
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
  }, [messages, loading]);

  function handleSend(value) {
    const text = value.trim();
    if (!text) return;
    if (loading) {
      pendingRef.current = text;
      setInput('');
      return;
    }
    setInput('');
    sendMessage({ text });
  }

  function handleSubmit(e) {
    e.preventDefault();
    handleSend(input);
  }

  function handleReset() {
    setInput('');
    reset();
    onReset?.();
  }

  const latestAssistantIndex = messages.findLastIndex((m) => m.role === 'assistant');

  return (
    <Card className="contact__bot" padding={0} aria-label="AgentsOX project intake assistant">
      <Card.Section className="contact__bot-top">
        <img
          src="/brand/agentsox-mark.svg"
          alt=""
          width="42"
          height="42"
          className="contact__bot-mark"
        />
        <div>
          <h3 className="contact__bot-title">AgentsOX intake bot</h3>
          <p className="contact__bot-subtitle">Tell me what&apos;s slowing you down.</p>
        </div>
        <MantineButton
          type="button"
          className="contact__bot-reset"
          variant="subtle"
          size="xs"
          onClick={handleReset}
        >
          Reset
        </MantineButton>
      </Card.Section>

      <ScrollArea.Autosize mah={420} className="contact__bot-scroll" viewportRef={viewportRef}>
        <Stack className="contact__bot-messages" gap="sm">
          {messages.map((message, index) => {
            const text = messageText(message);
            const isLatestAssistant = message.role === 'assistant' && index === latestAssistantIndex;
            const messageChips = chips[message.id];
            const isStreamingThis = isLatestAssistant && loading && !text;
            return (
              <Paper
                key={message.id || `${message.role}-${index}`}
                className={`contact__bot-message contact__bot-message--${message.role}`}
              >
                <Text>{text || (isStreamingThis ? <TypingDots /> : '')}</Text>
                {isLatestAssistant &&
                  Array.isArray(messageChips) &&
                  messageChips.length > 0 &&
                  !loading && (
                    <Group className="contact__bot-options" gap="xs">
                      {messageChips.map((option) => (
                        <MantineButton
                          key={option}
                          type="button"
                          className="contact__bot-option"
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
              <Paper className="contact__bot-message contact__bot-message--assistant">
                <Text><TypingDots /></Text>
              </Paper>
            )}
          {error && (
            <Paper className="contact__bot-message contact__bot-message--assistant">
              <Text>
                The assistant hit an error. You can still send the project form or email
                nadav@agentsox.com.
              </Text>
            </Paper>
          )}
        </Stack>
      </ScrollArea.Autosize>

      <form className="contact__bot-input-row" onSubmit={handleSubmit}>
        <TextInput
          className="contact__bot-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Message the AgentsOX intake bot"
          name="bot-message"
          autoComplete="off"
          placeholder="Describe your project..."
        />
        <MantineButton
          type="submit"
          className="contact__bot-send"
          variant="outline"
          radius="xl"
          disabled={!input.trim()}
        >
          Send
        </MantineButton>
      </form>
    </Card>
  );
}
