import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { THEME_TOKENS } from '../../themes/tokens';
import { FONT_CONFIG } from '../../themes/fonts';
import { useTheme } from '../../hooks/useTheme';
import './ThemeChooser.css';

const AESTHETICS = [
  { key: 'sleek', name: 'Sleek', descriptor: 'Precision & Performance' },
  { key: 'warm', name: 'Warm', descriptor: 'Human & Approachable' },
  { key: 'bold', name: 'Bold', descriptor: 'Statement & Impact' },
];

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const FADE_ONLY = { hidden: { opacity: 0 }, visible: { opacity: 1 } };

const containerVariants = prefersReducedMotion
  ? FADE_ONLY
  : {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.6, staggerChildren: 0.15, delayChildren: 0.35 } },
    };

const titleVariants = prefersReducedMotion
  ? FADE_ONLY
  : {
      hidden: { y: -30, opacity: 0 },
      visible: { y: 0, opacity: 1, transition: { duration: 0.6, delay: 0.2 } },
    };

const cardVariants = prefersReducedMotion
  ? FADE_ONLY
  : {
      hidden: { y: 60, opacity: 0, scale: 0.95 },
      visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
    };

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
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

  const handleSelect = useCallback(
    (key) => {
      if (selected) return;
      setSelected(key);
      setAesthetic(key);
      timersRef.current.push(
        setTimeout(() => setExiting(true), 400),
        setTimeout(() => markChosen(), 1200)
      );
    },
    [selected, setAesthetic, markChosen]
  );

  if (hasChosen) return null;

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          className="chooser-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          role="dialog"
          aria-modal="true"
          aria-label="Choose your theme"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <motion.h1 className="chooser-title" variants={titleVariants}>
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
                        style={{ backgroundColor: tokens['color-accent'] }}
                      >
                        Get Started
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
