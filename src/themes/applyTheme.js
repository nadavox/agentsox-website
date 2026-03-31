import { THEME_TOKENS } from './tokens';
import { FONT_CONFIG, loadFonts } from './fonts';

export function applyTheme(aesthetic, mode) {
  const tokens = THEME_TOKENS[aesthetic][mode];
  const fonts = FONT_CONFIG[aesthetic];
  const root = document.documentElement;

  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  root.style.setProperty('--font-heading', fonts.heading);
  root.style.setProperty('--font-body', fonts.body);
  root.style.setProperty('--font-mono', "'JetBrains Mono', ui-monospace, monospace");

  root.dataset.aesthetic = aesthetic;
  root.dataset.mode = mode;

  loadFonts(aesthetic);
}
