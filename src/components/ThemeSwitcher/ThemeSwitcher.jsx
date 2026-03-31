import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import './ThemeSwitcher.css';

const AESTHETICS = [
  { key: 'sleek', label: 'Sleek' },
  { key: 'warm', label: 'Warm' },
  { key: 'bold', label: 'Bold' },
];

export default function ThemeSwitcher() {
  const { aesthetic, mode, setAesthetic, toggleMode } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClose(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function handleEsc(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClose);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const abbrev = aesthetic.charAt(0).toUpperCase() + aesthetic.slice(1, 3);

  return (
    <div className="theme-switcher" ref={ref}>
      <button
        className="theme-switcher__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change theme"
        aria-expanded={open}
      >
        <span className="theme-switcher__dot" />
        <span className="theme-switcher__label">{abbrev}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="theme-switcher__dropdown"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <div className="theme-switcher__aesthetics">
              {AESTHETICS.map((a) => (
                <button
                  key={a.key}
                  className={`theme-switcher__option${aesthetic === a.key ? ' active' : ''}`}
                  onClick={() => setAesthetic(a.key)}
                >
                  <span className={`theme-switcher__dot theme-switcher__dot--${a.key}`} />
                  {a.label}
                </button>
              ))}
            </div>

            <div className="theme-switcher__divider" />

            <button
              className="theme-switcher__option theme-switcher__mode"
              onClick={toggleMode}
            >
              {mode === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
              {mode === 'dark' ? 'Light' : 'Dark'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
