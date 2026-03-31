import { NAV_LINKS } from '../../utils/navLinks';
import { smoothScrollTo } from '../../utils/smoothScroll';
import './Footer.css';

const QUICK_LINKS = [
  ...NAV_LINKS,
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
];

export default function Footer() {
  function handleSmoothScroll(e, href) {
    if (!href.startsWith('#')) return;
    e.preventDefault();
    smoothScrollTo(href.replace('#', ''));
  }

  return (
    <footer className="footer">
      <div className="footer__grid">
        <div className="footer__col">
          <a href="/" className="footer__wordmark">
            Agents<span className="footer__ox">OX</span>
          </a>
          <p className="footer__tagline">
            AI agents that handle the work, so you don&apos;t have to
          </p>
        </div>

        <div className="footer__col">
          <h4 className="footer__heading">Quick Links</h4>
          <ul className="footer__list">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="footer__link"
                  onClick={(e) => handleSmoothScroll(e, link.href)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer__col">
          <h4 className="footer__heading">Contact</h4>
          <a href="mailto:atlas@agentsox.com" className="footer__link">
            atlas@agentsox.com
          </a>
          <span className="footer__badge">Built with AI</span>
        </div>
      </div>

      <div className="footer__bottom">
        &copy; 2026 AgentsOX
      </div>
    </footer>
  );
}
