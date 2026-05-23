import { useEffect, useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { smoothScrollTo } from '../../utils/smoothScroll';
import './Hero.css';

const focusAreas = ['Leads', 'Admin', 'Reporting', 'Internal tools', 'Brand & SEO'];

const fadeUp = {
  hidden: { y: 32, opacity: 0 },
  visible: (delay) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function Hero() {
  const scrollOpacity = useMotionValue(1);
  const lastOpacityRef = useRef(1);

  useEffect(() => {
    function handleScroll() {
      const fade = Math.max(0, 1 - window.scrollY / 300);
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
      <div className="hero__bg" aria-hidden="true" />
      <div className="hero__decoration" aria-hidden="true" />

      <div className="hero__content">
        <motion.div
          className="hero__eyeline"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          aria-hidden="true"
        />

        <motion.h1
          className="hero__headline"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.2}
        >
          <span className="hero__headline-accent">AI automation</span> for
          business operations
        </motion.h1>

        <motion.p
          className="hero__subheadline"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.38}
        >
          AgentsOX designs practical AI systems around your real workflow:
          leads, admin, reporting, support, branding, SEO, and internal tools.
        </motion.p>

        <motion.div
          className="hero__proof-line"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.42}
        >
          Built around the business problem, not a fixed product.
        </motion.div>

        <motion.div
          className="hero__proof"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.48}
          aria-label="AgentsOX trust promises"
        >
          {focusAreas.map((area) => (
            <span key={area}>{area}</span>
          ))}
        </motion.div>

        <motion.div
          className="hero__cta"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.52}
        >
          <button
            className="hero__btn hero__btn--primary"
            onClick={() => smoothScrollTo('contact')}
          >
            Audit My Workflow
          </button>
          <button
            className="hero__btn hero__btn--ghost"
            onClick={() => smoothScrollTo('services')}
          >
            See Examples
          </button>
        </motion.div>

        <motion.div
          className="hero__system"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.64}
          aria-label="AgentsOX workflow approach"
        >
          <img src="/brand/agentsox-mark.svg" alt="" width="52" height="52" className="hero__system-mark" />
          <div className="hero__system-steps">
            <span>Listen</span>
            <span>Map</span>
            <span>Build</span>
            <span>Harden</span>
            <span>Support</span>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="hero__scroll-indicator"
        style={{ opacity: scrollOpacity }}
        aria-hidden="true"
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
