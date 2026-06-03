import { THEME_TOKENS } from './tokens';
import { FONT_CONFIG, loadFonts } from './fonts';

export function applyTheme(aesthetic, mode) {
  const safeAesthetic = THEME_TOKENS[aesthetic] ? aesthetic : 'sleek';
  const safeMode = THEME_TOKENS[safeAesthetic][mode] ? mode : 'dark';
  const tokens = THEME_TOKENS[safeAesthetic][safeMode];
  const fonts = FONT_CONFIG[safeAesthetic] || FONT_CONFIG.sleek;
  const root = document.documentElement;

  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  root.style.setProperty('--font-heading', fonts.heading);
  root.style.setProperty('--font-body', fonts.body);
  root.style.setProperty('--font-mono', "'JetBrains Mono', ui-monospace, monospace");

  root.dataset.aesthetic = safeAesthetic;
  root.dataset.mode = safeMode;

  loadFonts(safeAesthetic);
}
