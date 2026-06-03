// Brand fonts: Space Grotesk (display) + Inter (body). Single set by design -
// the warm/bold experimental font pairings were removed with their themes.
export const FONT_CONFIG = {
  sleek: {
    url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap',
    heading: "'Space Grotesk', sans-serif",
    body: "'Inter', sans-serif",
  },
};

export function loadFonts(aesthetic) {
  const config = FONT_CONFIG[aesthetic] || FONT_CONFIG.sleek;
  const id = 'theme-fonts';
  try {
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = config.url;
  } catch {
    // Font loading failed - CSS fallback fonts will be used
  }
}
