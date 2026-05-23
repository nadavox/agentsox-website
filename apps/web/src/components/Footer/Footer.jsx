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
    if (window.location.pathname !== '/') {
      window.location.assign(`/${href}`);
      return;
    }
    smoothScrollTo(href.replace('#', ''));
  }

  return (
    <footer className="footer">
      <div className="footer__grid">
        <div className="footer__col">
          <a href="/" className="footer__wordmark" aria-label="AgentsOX home">
            <img src="/brand/agentsox-mark.svg" alt="" width="32" height="32" className="footer__mark" />
            <span>Agents<span className="footer__ox">OX</span></span>
          </a>
          <p className="footer__tagline">
            Custom AI systems for real business operations.
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
          <a href="mailto:nadav@agentsox.com" className="footer__link" aria-label="Email us at nadav@agentsox.com">
            nadav@agentsox.com
          </a>
          <span className="footer__badge">Built around your workflow</span>
        </div>
      </div>

      <div className="footer__bottom">
        &copy; 2026 AgentsOX
      </div>
    </footer>
  );
}
