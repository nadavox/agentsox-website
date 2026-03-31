import { motion } from 'framer-motion';
import SectionWrapper from '../ui/SectionWrapper';
import './About.css';

const values = [
  {
    title: 'Automation First',
    description:
      "We don't automate for the sake of it. Every agent we build solves a real operational bottleneck.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    title: 'Human in the Loop',
    description:
      'AI handles execution, but humans stay in control. Every critical decision has a human checkpoint.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <circle cx="12" cy="10" r="3" />
        <path d="M7 20.662V19a2 2 0 012-2h6a2 2 0 012 2v1.662" />
      </svg>
    ),
  },
  {
    title: 'Built to Scale',
    description:
      'Our systems grow with your business \u2014 from solo founder to enterprise, without rebuilding.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="14" width="20" height="6" rx="1" />
        <rect x="4" y="8" width="16" height="6" rx="1" />
        <rect x="6" y="2" width="12" height="6" rx="1" />
      </svg>
    ),
  },
  {
    title: 'Privacy by Design',
    description:
      'Your data stays yours. We follow strict data minimization and never share with third parties.',
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
      <p className="section-label">ABOUT US</p>
      <h2 className="about__heading">Why AgentsOX</h2>
      <p className="about__narrative">
        We&apos;re an AI-first team that treats agents as colleagues, not
        just tools. Every system we ship is built on four principles that
        keep your business safe, scalable, and in your control.
      </p>

      <div className="about__grid">
        {values.map((value, i) => (
          <motion.div
            key={value.title}
            className="about__card"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            custom={i}
          >
            <div className="about__card-icon" aria-hidden="true">
              {value.icon}
            </div>
            <h3 className="about__card-title">{value.title}</h3>
            <p className="about__card-desc">{value.description}</p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}
