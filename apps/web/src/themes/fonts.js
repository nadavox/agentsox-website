export const FONT_CONFIG = {
  sleek: {
    url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Figtree:wght@400;500;600&display=swap',
    heading: "'Plus Jakarta Sans', sans-serif",
    body: "'Figtree', sans-serif",
  },
  warm: {
    url: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap',
    heading: "'Fraunces', serif",
    body: "'Plus Jakarta Sans', sans-serif",
  },
  bold: {
    url: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Onest:wght@400;500;600&display=swap',
    heading: "'Bricolage Grotesque', sans-serif",
    body: "'Onest', sans-serif",
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
