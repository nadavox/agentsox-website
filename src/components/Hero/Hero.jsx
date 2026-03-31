import { useEffect, useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { smoothScrollTo } from '../../utils/smoothScroll';
import './Hero.css';

const fadeUp = {
  hidden: { y: 40, opacity: 0 },
  visible: (delay) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 0.8, delay, ease: 'easeOut' },
  }),
};

export default function Hero() {
  const scrollOpacity = useMotionValue(1);
  const lastOpacityRef = useRef(1);

  useEffect(() => {
    function handleScroll() {
      const fade = Math.max(0, 1 - window.scrollY / 300);
      // Only update when the value changes meaningfully
      if (Math.abs(fade - lastOpacityRef.current) > 0.01) {
        lastOpacityRef.current = fade;
        scrollOpacity.set(fade);
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollOpacity]);

  return (
    <section className="hero" id="hero">
      <div className="hero__mesh" aria-hidden="true">
        <div className="hero__blob hero__blob--1" />
        <div className="hero__blob hero__blob--2" />
        <div className="hero__blob hero__blob--3" />
      </div>

      <div className="hero__decoration" aria-hidden="true" />

      <div className="hero__content">
        <motion.h1
          className="hero__headline"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <span className="hero__headline-accent">AI Agents</span> That Run Your Business
        </motion.h1>

        <motion.p
          className="hero__subheadline"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.2}
        >
          Intelligent automation for scheduling, communication, and daily
          operations — so you can focus on growing your business.
        </motion.p>

        <motion.div
          className="hero__cta"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.4}
        >
          <button
            className="hero__btn hero__btn--primary"
            onClick={() => smoothScrollTo('services')}
          >
            See How It Works
          </button>
          <button
            className="hero__btn hero__btn--ghost"
            onClick={() => smoothScrollTo('contact')}
          >
            Get in Touch
          </button>
        </motion.div>
      </div>

      {/* Fades out on scroll via motion value to avoid re-renders */}
      <motion.div
        className="hero__scroll-indicator"
        style={{ opacity: scrollOpacity }}
      >
        <motion.svg
          className="hero__chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </motion.div>
    </section>
  );
}
