import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { THEME_TOKENS } from '../../themes/tokens';
import { FONT_CONFIG } from '../../themes/fonts';
import { useTheme } from '../../hooks/useTheme';
import './ThemeChooser.css';

const AESTHETICS = [
  { key: 'sleek', name: 'Sleek', descriptor: 'Precision & Performance', ctaRadius: '6px', ctaLabel: 'Get Started' },
  { key: 'warm', name: 'Warm', descriptor: 'Human & Approachable', ctaRadius: '20px', ctaLabel: 'Let\u2019s Talk' },
  { key: 'bold', name: 'Bold', descriptor: 'Statement & Impact', ctaRadius: '2px', ctaLabel: 'Launch Now' },
];

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const FADE_ONLY = { hidden: { opacity: 0 }, visible: { opacity: 1 } };

const containerVariants = prefersReducedMotion
  ? FADE_ONLY
  : {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.35, staggerChildren: 0.08, delayChildren: 0.15 } },
    };

const titleVariants = prefersReducedMotion
  ? FADE_ONLY
  : {
      hidden: { y: -20, opacity: 0 },
      visible: { y: 0, opacity: 1, transition: { duration: 0.35, delay: 0.1 } },
    };

const cardVariants = prefersReducedMotion
  ? FADE_ONLY
  : {
      hidden: { y: 40, opacity: 0, scale: 0.97 },
      visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    };

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M14 8.5A6 6 0 0 1 7.5 2 6 6 0 1 0 14 8.5Z" />
    </svg>
  );
}

export default function ThemeChooser() {
  const { setAesthetic, setMode, mode, markChosen, hasChosen } = useTheme();
  const [selected, setSelected] = useState(null);
  const [exiting, setExiting] = useState(false);
  const timersRef = useRef([]);

  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  // Lock body scroll while chooser is visible
  useEffect(() => {
    if (hasChosen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [hasChosen]);

  const handleSelect = useCallback(
    (key) => {
      if (selected) return;
      setSelected(key);
      setAesthetic(key);
      timersRef.current.push(
        setTimeout(() => setExiting(true), 350),
        setTimeout(() => markChosen(), 900)
      );
    },
    [selected, setAesthetic, markChosen]
  );

  const handleSkip = useCallback(() => {
    if (selected) return;
    setAesthetic('sleek');
    setMode('dark');
    markChosen();
  }, [selected, setAesthetic, setMode, markChosen]);

  // Close on Escape key (skip to default)
  useEffect(() => {
    if (hasChosen) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') handleSkip();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [hasChosen, handleSkip]);

  // Focus trap inside dialog
  const overlayRef = useRef(null);
  useEffect(() => {
    if (hasChosen || !overlayRef.current) return;
    function trapFocus(e) {
      if (e.key !== 'Tab' || !overlayRef.current) return;
      const els = overlayRef.current.querySelectorAll('button, [tabindex="0"]');
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
  }, [hasChosen]);

  if (hasChosen) return null;

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          ref={overlayRef}
          className="chooser-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="chooser-dialog-title"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <motion.h1 id="chooser-dialog-title" className="chooser-title" variants={titleVariants}>
              Choose Your Experience
            </motion.h1>
            <motion.p className="chooser-subtitle" variants={titleVariants}>
              Pick the look that feels right. You can change it anytime.
            </motion.p>

            <div className="chooser-cards">
              {AESTHETICS.map((a) => {
                const tokens = THEME_TOKENS[a.key][mode];
                const fonts = FONT_CONFIG[a.key];
                const isSelected = selected === a.key;
                const isOther = selected && !isSelected;

                return (
                  <motion.div
                    key={a.key}
                    className="chooser-card"
                    variants={cardVariants}
                    whileHover={
                      !selected && !prefersReducedMotion
                        ? { scale: 1.03, boxShadow: `0 16px 48px rgba(0,0,0,0.5)` }
                        : {}
                    }
                    animate={
                      isSelected
                        ? { scale: 1.05, opacity: 1, borderColor: tokens['color-accent'] }
                        : isOther
                        ? { scale: 0.95, opacity: 0.3 }
                        : {}
                    }
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    style={{
                      backgroundColor: tokens['color-bg-secondary'],
                      borderColor: 'transparent',
                    }}
                    onClick={() => handleSelect(a.key)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(a.key);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Select ${a.name} theme: ${a.descriptor}`}
                  >
                    <div
                      className="chooser-card-preview"
                      style={{ backgroundColor: tokens['color-bg-primary'] }}
                    >
                      <h3
                        style={{
                          color: tokens['color-text-primary'],
                          fontFamily: fonts.heading,
                        }}
                      >
                        AI that works for you
                      </h3>
                      <p
                        style={{
                          color: tokens['color-text-secondary'],
                          fontFamily: fonts.body,
                        }}
                      >
                        Intelligent agents that handle your tasks, learn your preferences, and grow
                        with your business.
                      </p>
                      <span
                        className="chooser-card-cta"
                        style={{
                          backgroundColor: tokens['color-accent'],
                          borderRadius: a.ctaRadius,
                          textTransform: a.key === 'bold' ? 'uppercase' : 'none',
                          letterSpacing: a.key === 'bold' ? '0.08em' : '0',
                          fontFamily: fonts.body,
                        }}
                      >
                        {a.ctaLabel}
                      </span>
                    </div>
                    <div
                      className="chooser-card-label"
                      style={{
                        backgroundColor: tokens['color-bg-secondary'],
                        color: tokens['color-text-primary'],
                      }}
                    >
                      <strong style={{ fontFamily: fonts.heading }}>{a.name}</strong>
                      <span style={{ color: tokens['color-text-muted'] }}>{a.descriptor}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div className="toggle-container" variants={titleVariants}>
              <div className="toggle-pill" role="radiogroup" aria-label="Color mode">
                <button
                  className={mode === 'light' ? 'active' : ''}
                  onClick={() => setMode('light')}
                  role="radio"
                  aria-checked={mode === 'light'}
                >
                  <SunIcon /> Light
                </button>
                <button
                  className={mode === 'dark' ? 'active' : ''}
                  onClick={() => setMode('dark')}
                  role="radio"
                  aria-checked={mode === 'dark'}
                >
                  <MoonIcon /> Dark
                </button>
              </div>
            </motion.div>

            <motion.button
              className="chooser-skip"
              variants={titleVariants}
              onClick={handleSkip}
              type="button"
              aria-label="Skip theme selection and use default"
            >
              Just show me the site &rarr;
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
