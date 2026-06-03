import { motion } from 'framer-motion';
import SectionWrapper from '../ui/SectionWrapper';
import './About.css';

const values = [
  {
    title: 'Listen Before Building',
    description:
      'We learn how the business actually works before proposing the system. The workflow drives the technology, not the other way around.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    title: 'Human Control Stays Visible',
    description:
      'Sensitive steps need review, approval, or escalation. Every serious automation has a clear human checkpoint.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <circle cx="12" cy="10" r="3" />
        <path d="M7 20.662V19a2 2 0 012-2h6a2 2 0 012 2v1.662" />
      </svg>
    ),
  },
  {
    title: 'Failure Paths Are Designed',
    description:
      'If a model, API, form, or CRM step fails, the workflow should save the state, notify the owner, and make recovery obvious.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="14" width="20" height="6" rx="1" />
        <rect x="4" y="8" width="16" height="6" rx="1" />
        <rect x="6" y="2" width="12" height="6" rx="1" />
      </svg>
    ),
  },
  {
    title: 'Supported Until Trusted',
    description:
      'Launch is not the finish line. We explain, document, adjust, and support the system until the client feels safe using it.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' },
  }),
};

export default function About() {
  return (
    <SectionWrapper id="about" className="about" background="bg-secondary">
      <h2 className="about__heading">Built Around Your Real Workflow</h2>
      <p className="about__narrative">
        AgentsOX is for businesses of any size that need practical tech
        without being forced into a one-size-fits-all product. We sit with you
        first, build quickly, and harden the system until it is clear, useful,
        and trusted.
      </p>

      <motion.figure
        className="about__founder"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <img
          className="about__founder-photo"
          src="/brand/founder/nadav-agentsox-founder-profile-square.webp"
          alt="Nadav Oxenberg, founder of AgentsOX"
          width="120"
          height="120"
          loading="lazy"
          decoding="async"
        />
        <figcaption className="about__founder-body">
          <p className="about__founder-quote">
            You work with me directly. I learn how your business actually
            runs, build the system around it, and stay with you until you
            trust it day to day.
          </p>
          <span className="about__founder-id">
            <span className="about__founder-name">Nadav Oxenberg</span>
            <span className="about__founder-role">Founder, AgentsOX</span>
          </span>
        </figcaption>
      </motion.figure>

      <div className="about__list">
        {values.map((value, i) => (
          <motion.div
            key={value.title}
            className="about__item"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            custom={i}
          >
            <div className="about__item-icon" aria-hidden="true">
              {value.icon}
            </div>
            <div className="about__item-body">
              <h3 className="about__item-title">{value.title}</h3>
              <p className="about__item-desc">{value.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}
