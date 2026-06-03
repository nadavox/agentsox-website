import type { PublicWidgetConfig } from '@agentsox/faq-agent';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChatWidget } from './chat/ChatWidget';
import { WIDGET_CSS } from './chat/styles';

const LOG = '[agentsox-widget]';

/**
 * The embeddable entry. Loaded once via:
 *   <script src="https://faq.agentsox.com/widget.js" data-site-id="acme" async></script>
 *
 * It reads its own siteId + origin off the script tag, fetches the public widget
 * config, and mounts the chat into an isolated shadow root so nothing clashes with
 * the host page. Everything client-specific is data from /api/widget-config.
 */
(function bootstrap() {
  // currentScript is valid during synchronous eval (classic async script). Fall back
  // to a query for robustness (e.g. if loaded as a module, where currentScript is null).
  const script =
    (document.currentScript as HTMLScriptElement | null) ??
    document.querySelector<HTMLScriptElement>('script[data-site-id][src*="widget"]');

  const siteId = script?.getAttribute('data-site-id');
  if (!script || !siteId) {
    console.error(`${LOG} missing <script data-site-id="...">`);
    return;
  }

  let apiBase: string;
  try {
    apiBase = new URL(script.src).origin;
  } catch {
    console.error(`${LOG} could not resolve the widget origin`);
    return;
  }

  // The hosted page at /c/:siteId sets data-open to show the chat immediately.
  const defaultOpen = script.getAttribute('data-open') === 'true';

  void (async () => {
    let config: PublicWidgetConfig;
    try {
      const res = await fetch(`${apiBase}/api/widget-config?siteId=${encodeURIComponent(siteId)}`);
      if (!res.ok) {
        console.error(`${LOG} widget-config ${res.status} for siteId "${siteId}"`);
        return;
      }
      config = (await res.json()) as PublicWidgetConfig;
    } catch (err) {
      console.error(`${LOG} failed to load widget-config`, err);
      return;
    }

    const host = document.createElement('div');
    host.id = 'agentsox-faq-widget';
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = WIDGET_CSS;
    shadow.appendChild(style);
    const mount = document.createElement('div');
    shadow.appendChild(mount);

    createRoot(mount).render(
      <StrictMode>
        <ChatWidget config={config} apiBase={apiBase} defaultOpen={defaultOpen} />
      </StrictMode>,
    );
  })();
})();
