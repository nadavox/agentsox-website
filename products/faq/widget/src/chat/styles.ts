// CSS injected into the widget's shadow root. Because it lives in a shadow tree,
// these selectors can't leak out and the host page's CSS can't reach in. Theme
// tokens come in as CSS variables set on `.aox` from the per-client config.
export const WIDGET_CSS = `
:host, * { box-sizing: border-box; }
.aox {
  --aox-primary: #2563eb;
  --aox-on-primary: #ffffff;
  --aox-surface: #ffffff;
  --aox-text: #111827;
  --aox-muted: #6b7280;
  --aox-border: #e5e7eb;
  --aox-bubble-user: var(--aox-primary);
  --aox-radius: 16px;
  position: fixed;
  bottom: 20px;
  z-index: 2147483000;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 15px;
  line-height: 1.45;
  color: var(--aox-text);
}
.aox[data-pos="right"] { right: 20px; }
.aox[data-pos="left"] { left: 20px; }

.aox-launcher {
  width: 56px; height: 56px; border-radius: 50%;
  border: none; cursor: pointer;
  background: var(--aox-primary); color: var(--aox-on-primary);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 24px rgba(0,0,0,.18);
  transition: transform .15s ease;
}
.aox-launcher:hover { transform: scale(1.05); }
.aox-launcher svg { width: 26px; height: 26px; }

.aox-panel {
  width: 380px; max-width: calc(100vw - 32px);
  height: 560px; max-height: calc(100vh - 100px);
  background: var(--aox-surface);
  border: 1px solid var(--aox-border);
  border-radius: var(--aox-radius);
  box-shadow: 0 16px 48px rgba(0,0,0,.22);
  display: flex; flex-direction: column; overflow: hidden;
}
@media (max-width: 480px) {
  .aox { bottom: 0; right: 0; left: 0; }
  .aox-panel { width: 100vw; max-width: 100vw; height: 100dvh; max-height: 100dvh; border-radius: 0; }
}

.aox-header {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px; padding: 14px 16px;
  background: var(--aox-primary); color: var(--aox-on-primary);
}
.aox-title { margin: 0; font-size: 15px; font-weight: 600; }
.aox-iconbtn {
  background: transparent; border: none; color: inherit; cursor: pointer;
  padding: 4px; border-radius: 8px; opacity: .85; display: inline-flex;
}
.aox-iconbtn:hover { opacity: 1; }
.aox-actions { display: flex; align-items: center; gap: 4px; }
.aox-reset { font-size: 12px; }

.aox-scroll { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.aox-msg { max-width: 85%; padding: 10px 13px; border-radius: 14px; white-space: pre-wrap; word-wrap: break-word; }
.aox-msg--assistant { background: #f3f4f6; color: var(--aox-text); align-self: flex-start; border-bottom-left-radius: 4px; }
.aox-msg--user { background: var(--aox-bubble-user); color: var(--aox-on-primary); align-self: flex-end; border-bottom-right-radius: 4px; }
.aox[dir="rtl"] .aox-msg--assistant { border-bottom-left-radius: 14px; border-bottom-right-radius: 4px; }
.aox[dir="rtl"] .aox-msg--user { border-bottom-right-radius: 14px; border-bottom-left-radius: 4px; }

.aox-cta { margin-top: 8px; }
.aox-cta-reason { margin: 0 0 6px; font-size: 13px; color: var(--aox-muted); }
.aox-cta-btn {
  display: inline-block; padding: 8px 14px; border-radius: 999px;
  background: var(--aox-primary); color: var(--aox-on-primary);
  border: none; cursor: pointer; font-size: 14px; font-weight: 600; text-decoration: none;
}
.aox-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.aox-chip {
  padding: 6px 12px; border-radius: 999px; cursor: pointer; font-size: 13px;
  background: transparent; color: var(--aox-primary);
  border: 1px solid var(--aox-primary);
}
.aox-chip:hover { background: color-mix(in srgb, var(--aox-primary) 10%, transparent); }

.aox-typing { display: inline-flex; gap: 4px; }
.aox-typing span { width: 6px; height: 6px; border-radius: 50%; background: var(--aox-muted); animation: aox-bounce 1.2s infinite ease-in-out; }
.aox-typing span:nth-child(2) { animation-delay: .15s; }
.aox-typing span:nth-child(3) { animation-delay: .3s; }
@keyframes aox-bounce { 0%, 60%, 100% { transform: translateY(0); opacity: .5; } 30% { transform: translateY(-4px); opacity: 1; } }

.aox-form { display: flex; gap: 8px; padding: 12px; border-top: 1px solid var(--aox-border); }
.aox-input {
  flex: 1; padding: 10px 12px; border: 1px solid var(--aox-border);
  border-radius: 999px; font: inherit; outline: none; background: var(--aox-surface); color: var(--aox-text);
}
.aox-input:focus { border-color: var(--aox-primary); }
.aox-send {
  padding: 10px 16px; border-radius: 999px; border: none; cursor: pointer;
  background: var(--aox-primary); color: var(--aox-on-primary); font: inherit; font-weight: 600;
}
.aox-send:disabled { opacity: .5; cursor: default; }
`;
