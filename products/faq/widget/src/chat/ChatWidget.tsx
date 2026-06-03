import type { PublicWidgetConfig } from '@agentsox/faq-agent';
import type { UIMessage } from 'ai';
import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { messageText, useFaqChat } from './useFaqChat';

const STRINGS = {
  en: { placeholder: 'Ask anything…', send: 'Send', reset: 'Reset', close: 'Close', open: 'Open chat', error: 'Something went wrong. Please try again.' },
  he: { placeholder: 'שאלו אותי כל דבר…', send: 'שליחה', reset: 'איפוס', close: 'סגירה', open: 'פתיחת צ׳אט', error: 'משהו השתבש, נסו שוב.' },
} as const;

function strings(locale: string) {
  return locale.toLowerCase().startsWith('he') ? STRINGS.he : STRINGS.en;
}

function themeVars(config: PublicWidgetConfig): CSSProperties {
  const t = config.theme ?? {};
  const vars: Record<string, string> = {};
  if (t.primary) vars['--aox-primary'] = t.primary;
  if (t.onPrimary) vars['--aox-on-primary'] = t.onPrimary;
  if (t.surface) vars['--aox-surface'] = t.surface;
  if (t.text) vars['--aox-text'] = t.text;
  return vars as CSSProperties;
}

function greetingMessages(config: PublicWidgetConfig): UIMessage[] {
  if (!config.greeting) return [];
  return [{ id: 'aox-greeting', role: 'assistant', parts: [{ type: 'text', text: config.greeting }] }];
}

function Typing() {
  return (
    <span className="aox-typing" aria-hidden="true">
      <span /><span /><span />
    </span>
  );
}

export function ChatWidget({
  config,
  apiBase,
  defaultOpen = false,
}: {
  config: PublicWidgetConfig;
  apiBase: string;
  defaultOpen?: boolean;
}) {
  const t = strings(config.locale);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [input, setInput] = useState('');
  const viewportRef = useRef<HTMLDivElement>(null);
  const initialMessages = useMemo(() => greetingMessages(config), [config]);

  const { messages, sendMessage, status, error, chips, intakeCtas, reset } = useFaqChat({
    endpoint: `${apiBase}/api/chat`,
    siteId: config.id,
    initialMessages,
  });
  const loading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    const v = viewportRef.current;
    if (v) v.scrollTo({ top: v.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, isOpen]);

  function handleSend(value: string) {
    const text = value.trim();
    if (!text || loading) return;
    setInput('');
    sendMessage({ text });
  }

  const latestAssistant = messages.findLastIndex((m) => m.role === 'assistant');
  const dir = config.rtl ? 'rtl' : 'ltr';

  return (
    <div className="aox" dir={dir} lang={config.locale} data-pos={config.position} style={themeVars(config)}>
      {!isOpen && (
        <button type="button" className="aox-launcher" aria-label={config.launcherLabel || t.open} onClick={() => setIsOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="aox-panel" role="dialog" aria-label={config.title || 'FAQ'}>
          <header className="aox-header">
            <h3 className="aox-title">{config.title}</h3>
            <div className="aox-actions">
              <button type="button" className="aox-iconbtn aox-reset" onClick={() => { setInput(''); reset(); }}>
                {t.reset}
              </button>
              <button type="button" className="aox-iconbtn" aria-label={t.close} onClick={() => setIsOpen(false)}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </header>

          <div className="aox-scroll" ref={viewportRef} aria-live="polite">
            {messages.map((message, index) => {
              const text = messageText(message);
              const isLatestAssistant = message.role === 'assistant' && index === latestAssistant;
              const cta = intakeCtas[message.id];
              const msgChips = chips[message.id];
              const streamingThis = isLatestAssistant && loading && !text;
              return (
                <div key={message.id || `${message.role}-${index}`} className={`aox-msg aox-msg--${message.role}`}>
                  {text || (streamingThis ? <Typing /> : '')}
                  {cta && message.role === 'assistant' && (
                    <div className="aox-cta">
                      <p className="aox-cta-reason">{cta.reason}</p>
                      {config.handoff?.url ? (
                        <a className="aox-cta-btn" href={config.handoff.url} target="_blank" rel="noopener noreferrer">
                          {config.handoff.actionPhrase}
                        </a>
                      ) : config.handoff ? (
                        <span className="aox-cta-btn">{config.handoff.actionPhrase}</span>
                      ) : null}
                    </div>
                  )}
                  {isLatestAssistant && Array.isArray(msgChips) && msgChips.length > 0 && !loading && (
                    <div className="aox-chips">
                      {msgChips.map((option) => (
                        <button key={option} type="button" className="aox-chip" onClick={() => handleSend(option)}>
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {loading && (latestAssistant === -1 || messages[messages.length - 1]?.role === 'user') && (
              <div className="aox-msg aox-msg--assistant"><Typing /></div>
            )}
            {error && <div className="aox-msg aox-msg--assistant">{t.error}</div>}
          </div>

          <form className="aox-form" onSubmit={(e) => { e.preventDefault(); handleSend(input); }}>
            <input
              className="aox-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              aria-label={config.title || 'FAQ'}
              autoComplete="off"
            />
            <button type="submit" className="aox-send" disabled={!input.trim() || loading}>
              {t.send}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
