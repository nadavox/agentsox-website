import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeSwitcher from '../ThemeSwitcher/ThemeSwitcher';
import { NAV_LINKS } from '../../utils/navLinks';
import { smoothScrollTo } from '../../utils/smoothScroll';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleLinkClick(e, href) {
    e.preventDefault();
    setMenuOpen(false);
    smoothScrollTo(href.replace('#', ''));
  }

  return (
    <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        <a href="/" className="navbar__wordmark">
          Agents<span className="navbar__ox">OX</span>
        </a>

        <div className="navbar__links">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="navbar__link"
              onClick={(e) => handleLinkClick(e, link.href)}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="navbar__right">
          <ThemeSwitcher />
          <button
            className="navbar__hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span className={`navbar__hamburger-line${menuOpen ? ' open' : ''}`} />
            <span className={`navbar__hamburger-line${menuOpen ? ' open' : ''}`} />
            <span className={`navbar__hamburger-line${menuOpen ? ' open' : ''}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="navbar__drawer"
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
