export const FONT_CONFIG = {
  sleek: {
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
  warm: {
    url: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap',
    heading: "'DM Serif Display', serif",
    body: "'DM Sans', sans-serif",
  },
  bold: {
    url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Outfit:wght@400;500;600&display=swap',
    heading: "'Space Grotesk', sans-serif",
    body: "'Outfit', sans-serif",
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
    // Font loading failed — CSS fallback fonts will be used
  }
}
