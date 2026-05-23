import { motion } from 'framer-motion';
import SectionWrapper from '../ui/SectionWrapper';
import './Services.css';

const services = [
  {
    title: 'AI Chatbots',
    description:
      'Website, WhatsApp, or internal assistants for lead capture, FAQs, booking, routing, and business-specific workflows.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="6" y="10" width="36" height="32" rx="4" />
        <line x1="6" y1="20" x2="42" y2="20" />
        <line x1="16" y1="6" x2="16" y2="14" />
        <line x1="32" y1="6" x2="32" y2="14" />
        <rect x="14" y="26" width="6" height="6" rx="1" />
        <rect x="26" y="26" width="6" height="6" rx="1" />
        <rect x="14" y="34" width="6" height="4" rx="1" />
      </svg>
    ),
  },
  {
    title: 'Business Automations',
    description:
      'Scheduling, reminders, CRM updates, follow-ups, documents, notifications, and repetitive admin workflows.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 36l4-8H8a4 4 0 01-4-4V12a4 4 0 014-4h20a4 4 0 014 4v12a4 4 0 01-4 4H18l-10 8z" />
        <path d="M32 20h8a4 4 0 014 4v12a4 4 0 01-4 4h-4l-10 8 4-8h-2" />
      </svg>
    ),
  },
  {
    title: 'Business Analytics',
    description:
      'Dashboards and reports that help owners see leads, bookings, revenue signals, bottlenecks, and work progress.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="24" cy="24" r="8" />
        <path d="M24 4v4M24 40v4M4 24h4M40 24h4" />
        <path d="M9.86 9.86l2.83 2.83M35.31 35.31l2.83 2.83M9.86 38.14l2.83-2.83M35.31 12.69l2.83-2.83" />
        <circle cx="24" cy="24" r="16" strokeDasharray="4 4" />
      </svg>
    ),
  },
  {
    title: 'Workflow Optimization',
    description:
      'We review the current process, remove manual steps, and connect the tools your team already depends on.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 12h10l6 24h16" />
        <path d="M8 36h10l6-24h16" />
        <circle cx="8" cy="12" r="3" />
        <circle cx="8" cy="36" r="3" />
        <circle cx="40" cy="12" r="3" />
        <circle cx="40" cy="36" r="3" />
        <path d="M21 24h6" />
      </svg>
    ),
  },
  {
    title: 'Training & Support',
    description:
      'Hands-on workshops, documentation, and post-launch support so the system is understood and trusted.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 12h24a8 8 0 018 8v16H16a8 8 0 01-8-8V12z" />
        <path d="M16 20h16M16 28h10" />
        <path d="M34 34l4 4 6-8" />
      </svg>
    ),
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function Services() {
  return (
    <SectionWrapper id="services" className="services">
      <p className="section-label">WHAT WE DO</p>
      <h2 className="services__heading">Custom Solutions, Not Generic AI Products</h2>
      <p className="services__description">
        We start with one business problem, map the real workflow, and build the
        system around your tools, team, and trust requirements.
      </p>

      <motion.div
        className="services__grid"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        {services.map((service) => (
          <motion.article key={service.title} className="services__card" variants={cardVariants}>
            <div className="services__card-icon">{service.icon}</div>
            <h3 className="services__card-title">{service.title}</h3>
            <p className="services__card-description">{service.description}</p>
          </motion.article>
        ))}
      </motion.div>
    </SectionWrapper>
  );
}
