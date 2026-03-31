import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeSwitcher from '../ThemeSwitcher/ThemeSwitcher';
import { NAV_LINKS } from '../../utils/navLinks';
import { smoothScrollTo } from '../../utils/smoothScroll';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const drawerRef = useRef(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close drawer on Escape key
  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  // Focus trap inside drawer when open
  useEffect(() => {
    if (!menuOpen || !drawerRef.current) return;
    const focusable = drawerRef.current.querySelectorAll('a, button, [tabindex]');
    if (focusable.length) focusable[0].focus();

    function trapFocus(e) {
      if (e.key !== 'Tab' || !drawerRef.current) return;
      const els = drawerRef.current.querySelectorAll('a, button, [tabindex]');
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', trapFocus);
    return () => document.removeEventListener('keydown', trapFocus);
  }, [menuOpen]);

  function handleLinkClick(e, href) {
    e.preventDefault();
    setMenuOpen(false);
    smoothScrollTo(href.replace('#', ''));
  }

  return (
    <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        <a href="/" className="navbar__wordmark" aria-label="AgentsOX home">
          Agents<span className="navbar__ox">OX</span>
        </a>

        <ul className="navbar__links" role="menubar">
          {NAV_LINKS.map((link) => (
            <li key={link.href} role="none">
              <a
                href={link.href}
                className="navbar__link"
                role="menuitem"
                onClick={(e) => handleLinkClick(e, link.href)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="navbar__right">
          <ThemeSwitcher />
          <button
            className="navbar__hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="navbar-drawer"
          >
            <span className={`navbar__hamburger-line${menuOpen ? ' open' : ''}`} />
            <span className={`navbar__hamburger-line${menuOpen ? ' open' : ''}`} />
            <span className={`navbar__hamburger-line${menuOpen ? ' open' : ''}`} />
          </button>
        </div>
      </div>

      <div
        className="navbar__scroll-progress"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            ref={drawerRef}
            id="navbar-drawer"
            className="navbar__drawer"
            role="dialog"
            aria-label="Navigation menu"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="navbar__drawer-link"
                onClick={(e) => handleLinkClick(e, link.href)}
              >
                {link.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
