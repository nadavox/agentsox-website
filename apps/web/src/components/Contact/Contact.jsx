import { useRef, useEffect, useMemo, useState } from 'react';
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
import { motion, AnimatePresence } from 'framer-motion';
import SectionWrapper from '../ui/SectionWrapper';
import Button from '../ui/Button';
import './Contact.css';

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1, ease: 'easeOut' },
  }),
};

const MAX_SUBMISSIONS = 2;
const STORAGE_KEY = 'agentsox-contact-count';
const BOT_ENDPOINT = import.meta.env.VITE_INTAKE_BOT_ENDPOINT || '';
const CONTACT_ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT || '';

const BOT_SITE_ID = 'agentsox-main';

const FIRST_OPTIONS = [
  'Missed leads',
  'Booking / scheduling',
  'Customer follow-up',
  'Reporting / analytics',
  'Manual admin',
  'Not sure yet',
];

const initialMessages = [
  {
    role: 'assistant',
    content:
      'Tell me one workflow that feels slow, manual, missed, or hard to trust. I will help shape it before you send it.',
    options: FIRST_OPTIONS,
    renderOptions: true,
    optionType: 'problem_category',
  },
];

function getSubmissionCount() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const now = Date.now();
    // Reset after 24 hours
    if (data.ts && now - data.ts > 24 * 60 * 60 * 1000) return 0;
    return data.count || 0;
  } catch { return 0; }
}

function incrementSubmissionCount() {
  const count = getSubmissionCount() + 1;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ count, ts: Date.now() })); } catch { /* localStorage unavailable */ }
  return count;
}

function buildSummary(context) {
  const parts = [];
  if (context.problem) parts.push(`Problem: ${context.problem}`);
  if (context.businessType) parts.push(`Business: ${context.businessType}`);
  if (context.tools) parts.push(`Current tools: ${context.tools}`);
  if (context.details) parts.push(`Details: ${context.details}`);
  return parts.join('\n');
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function Contact() {
  const [botMessages, setBotMessages] = useState(initialMessages);
  const [botInput, setBotInput] = useState('');
  const [botContext, setBotContext] = useState({});
  const [leadReady, setLeadReady] = useState(false);
  const [botLoading, setBotLoading] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [messageEdited, setMessageEdited] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitState, setSubmitState] = useState('idle');
  const [submitError, setSubmitError] = useState('');
  const [submissionCount, setSubmissionCount] = useState(() => getSubmissionCount());
  const isSubmitting = submitState === 'sending';
  const isSucceeded = submitState === 'succeeded';
  const isRateLimited = submissionCount >= MAX_SUBMISSIONS;
  const successRef = useRef(null);
  const botViewportRef = useRef(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const messageRef = useRef(null);

  const workflowSummary = useMemo(() => buildSummary(botContext), [botContext]);
  const isNameValid = contactName.trim().length >= 2;
  const isEmailValid = isValidEmail(contactEmail);
  const isMessageValid = contactMessage.trim().length >= 10;
  const canSubmit =
    isNameValid &&
    isEmailValid &&
    isMessageValid &&
    !isSubmitting &&
    !isRateLimited;
  const submitHelpText = isRateLimited
    ? 'We received your message. Please wait before sending another workflow.'
    : 'Complete your name, a valid email, and the workflow brief before sending.';

  useEffect(() => {
    if (isSucceeded && successRef.current) {
      successRef.current.focus();
    }
  }, [isSucceeded]);

  useEffect(() => {
    if (workflowSummary && !messageEdited) {
      setContactMessage(workflowSummary);
    }
  }, [messageEdited, workflowSummary]);

  useEffect(() => {
    const viewport = botViewportRef.current;
    if (!viewport) return undefined;

    const scrollToBottom = () => {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: 'smooth',
      });
    };

    const frame = requestAnimationFrame(scrollToBottom);
    const timeout = window.setTimeout(scrollToBottom, 80);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [botMessages, botLoading]);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!canSubmit) {
      e.currentTarget.reportValidity();
      if (!isNameValid) nameRef.current?.focus();
      else if (!isEmailValid) emailRef.current?.focus();
      else if (!isMessageValid) messageRef.current?.focus();
      return;
    }

    setSubmitState('sending');
    setSubmitError('');

    try {
      if (!CONTACT_ENDPOINT) {
        throw new Error('Contact endpoint is not configured');
      }

      const response = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: BOT_SITE_ID,
          name: contactName,
          email: contactEmail,
          message: contactMessage,
          source: 'agentsox-website-contact',
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || 'Contact endpoint failed');
      }

      setSubmissionCount(incrementSubmissionCount());
      setSubmitState('succeeded');
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Could not send your message right now',
      );
      setSubmitState('error');
    }
  }

  async function sendBotMessage(value) {
    const text = value.trim();
    if (!text || botLoading) return;

    const userMessage = { role: 'user', content: text };
    const nextMessages = [...botMessages, userMessage];
    setBotMessages(nextMessages);
    setBotInput('');
    setBotLoading(true);

    try {
      if (!BOT_ENDPOINT) {
        throw new Error('Bot endpoint is not configured');
      }

      const response = await fetch(BOT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: BOT_SITE_ID,
          context: botContext,
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Bot endpoint failed');
      }

      const nextContext = data.context || botContext;
      setBotContext(nextContext);
      setLeadReady(Boolean(data.leadReady));
      setBotMessages((messages) => [
        ...messages,
        {
          role: 'assistant',
          content: data.reply || data.message || 'Got it. What else should I know?',
          options: data.options,
          renderOptions: Boolean(data.renderOptions),
          optionType: data.optionType,
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error && error.message.includes('Too many requests')
          ? 'Too many messages were sent too quickly. Please wait a minute and try again.'
          : 'The assistant is unavailable right now. You can still send the workflow form or email nadav@agentsox.com.';

      setBotMessages((messages) => [
        ...messages,
        {
          role: 'assistant',
          content: message,
        },
      ]);
    } finally {
      setBotLoading(false);
    }
  }

  function handleBotSubmit(e) {
    e.preventDefault();
    sendBotMessage(botInput);
  }

  function resetBot() {
    setBotMessages(initialMessages);
    setBotInput('');
    setBotContext({});
    setLeadReady(false);
    setMessageEdited(false);
    setContactMessage('');
  }

  const latestAssistantIndex = botMessages.findLastIndex(
    (message) => message.role === 'assistant',
  );

  return (
    <SectionWrapper id="contact" className="contact" background="bg-secondary">
      <div className="contact__header">
        <p className="section-label">START HERE</p>
        <h2 className="contact__heading">Start With One Workflow</h2>
        <p className="contact__text">
          Describe one workflow, offer, or client acquisition problem you want
          to improve. AgentsOX will shape the first useful system around it.
        </p>
        <p className="contact__privacy-note">
          Do not include passwords, medical records, payment details, or other sensitive data.
          The brief is used to understand the workflow and follow up.
        </p>
      </div>

      <div className="contact__columns">
        <div className="contact__info">
          <Card className="contact__bot" padding={0} aria-label="AgentsOX workflow intake bot">
            <Card.Section className="contact__bot-top">
              <img src="/brand/agentsox-mark.svg" alt="" width="42" height="42" className="contact__bot-mark" />
              <div>
                <h3 className="contact__bot-title">AgentsOX intake bot</h3>
                <p className="contact__bot-subtitle">
                  Answers questions and shapes a workflow brief.
                </p>
              </div>
              <MantineButton
                type="button"
                className="contact__bot-reset"
                variant="subtle"
                size="xs"
                onClick={resetBot}
              >
                Reset
              </MantineButton>
            </Card.Section>

            <ScrollArea.Autosize
              mah={420}
              className="contact__bot-scroll"
              viewportRef={botViewportRef}
            >
              <Stack className="contact__bot-messages" gap="sm">
                {botMessages.map((message, index) => (
                  <Paper
                    key={`${message.role}-${index}`}
                    className={`contact__bot-message contact__bot-message--${message.role}`}
                  >
                    <Text>{message.content}</Text>
                    {message.role === 'assistant' &&
                      index === latestAssistantIndex &&
                      message.renderOptions === true &&
                      Array.isArray(message.options) &&
                      message.options.length > 0 &&
                      !botLoading && (
                      <Group className="contact__bot-options" gap="xs">
                        {message.options.map((option) => (
                          <MantineButton
                            key={option}
                            type="button"
                            className="contact__bot-option"
                            variant="outline"
                            size="xs"
                            radius="xl"
                            onClick={() => sendBotMessage(option)}
                            disabled={botLoading}
                          >
                            {option}
                          </MantineButton>
                        ))}
                      </Group>
                    )}
                  </Paper>
                ))}
                {botLoading && (
                  <Paper className="contact__bot-message contact__bot-message--assistant">
                    <Text>Thinking through the workflow...</Text>
                  </Paper>
                )}
              </Stack>
            </ScrollArea.Autosize>

            <form className="contact__bot-input-row" onSubmit={handleBotSubmit}>
              <TextInput
                className="contact__bot-input"
                value={botInput}
                onChange={(e) => setBotInput(e.target.value)}
                aria-label="Message the AgentsOX intake bot"
                name="bot-message"
                autoComplete="off"
                placeholder="Type an answer or ask a FAQ…"
                disabled={botLoading}
              />
              <MantineButton
                type="submit"
                className="contact__bot-send"
                variant="outline"
                radius="xl"
                disabled={botLoading || !botInput.trim()}
              >
                Send
              </MantineButton>
            </form>
          </Card>

          <Card className={`contact__brief${leadReady ? ' contact__brief--ready' : ''}`}>
            <h3 className="contact__next-title">Workflow brief</h3>
            {workflowSummary ? (
              <>
                <pre>{workflowSummary}</pre>
                <button type="button" className="contact__brief-edit" onClick={() => messageRef.current?.focus()}>
                  Edit before sending
                </button>
              </>
            ) : (
              <p>Answer the bot questions and this will become the message you send.</p>
            )}
          </Card>
        </div>

        <div className="contact__form-wrapper">
          <AnimatePresence mode="wait">
            {isRateLimited && !isSucceeded ? (
              <motion.div
                key="limited"
                className="contact__success"
                role="status"
                aria-live="polite"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <p className="contact__success-text">
                  We received your message and will reply within one business day.
                </p>
              </motion.div>
            ) : isSucceeded ? (
              <motion.div
                ref={successRef}
                key="success"
                className="contact__success"
                role="status"
                aria-live="polite"
                tabIndex={-1}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <svg
                  className="contact__success-icon"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                <p className="contact__success-text">
                  Message received — we&apos;ll get back to you shortly.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                className="contact__form"
                onSubmit={onSubmit}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {submitError && (
                  <div className="contact__error" role="alert">
                    {submitError}. Please try again, or email us directly at{' '}
                    <a href="mailto:nadav@agentsox.com">nadav@agentsox.com</a>.
                  </div>
                )}

                <motion.div
                  className="contact__field"
                  variants={fieldVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={0}
                >
                  <label className="contact__field-label" htmlFor="contact-name">
                    Name
                  </label>
                  <input
                    ref={nameRef}
                    id="contact-name"
                    className="contact__input"
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                    placeholder="Your name…"
                    required
                    aria-required="true"
                    aria-invalid={(submitAttempted || contactName.length > 0) && !isNameValid ? 'true' : undefined}
                    aria-describedby={submitAttempted && !isNameValid ? 'contact-name-error' : undefined}
                    minLength={2}
                    disabled={isSubmitting}
                  />
                  {submitAttempted && !isNameValid && (
                    <p id="contact-name-error" className="contact__field-error">
                      Enter at least 2 characters.
                    </p>
                  )}
                </motion.div>

                <motion.div
                  className="contact__field"
                  variants={fieldVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={1}
                >
                  <label className="contact__field-label" htmlFor="contact-email">
                    Email
                  </label>
                  <input
                    ref={emailRef}
                    id="contact-email"
                    className="contact__input"
                    type="email"
                    name="email"
                    autoComplete="email"
                    spellCheck="false"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    placeholder="you@company.com…"
                    required
                    aria-required="true"
                    aria-invalid={(submitAttempted || contactEmail.length > 0) && !isEmailValid ? 'true' : undefined}
                    aria-describedby={submitAttempted && !isEmailValid ? 'contact-email-error' : undefined}
                    disabled={isSubmitting}
                  />
                  {submitAttempted && !isEmailValid && (
                    <p id="contact-email-error" className="contact__field-error">
                      Enter a valid email address.
                    </p>
                  )}
                </motion.div>

                <motion.div
                  className="contact__field"
                  variants={fieldVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={2}
                >
                  <label className="contact__field-label" htmlFor="contact-message">
                    Message
                  </label>
                  <textarea
                    ref={messageRef}
                    id="contact-message"
                    className="contact__input contact__textarea"
                    name="message"
                    autoComplete="off"
                    value={contactMessage}
                    onChange={(event) => {
                      setMessageEdited(true);
                      setContactMessage(event.target.value);
                    }}
                    placeholder="What workflow do you want to improve? Include the tools you use today if you know them…"
                    required
                    aria-required="true"
                    aria-invalid={(submitAttempted || contactMessage.length > 0) && !isMessageValid ? 'true' : undefined}
                    aria-describedby={submitAttempted && !isMessageValid ? 'contact-message-error' : undefined}
                    minLength={10}
                    rows={5}
                    disabled={isSubmitting}
                  />
                  {submitAttempted && !isMessageValid && (
                    <p id="contact-message-error" className="contact__field-error">
                      Describe the workflow in at least 10 characters.
                    </p>
                  )}
                </motion.div>

                <motion.div
                  variants={fieldVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={3}
                >
                  <Button
                    type="submit"
                    disabled={isSubmitting || isRateLimited}
                    className="contact__submit"
                    aria-busy={isSubmitting}
                    aria-describedby={!canSubmit && !isSubmitting ? 'contact-submit-help' : undefined}
                  >
                    {isSubmitting ? (
                      <span className="contact__spinner" aria-label="Sending" />
                    ) : (
                      'Send Workflow'
                    )}
                  </Button>
                  {!canSubmit && !isSubmitting && (
                    <p
                      id="contact-submit-help"
                      className="contact__submit-note"
                      role="status"
                      aria-live="polite"
                    >
                      {submitHelpText}
                    </p>
                  )}
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </SectionWrapper>
  );
}
