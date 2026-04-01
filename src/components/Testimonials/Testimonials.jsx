import { motion } from 'framer-motion';
import SectionWrapper from '../ui/SectionWrapper';
import './Testimonials.css';

const projects = [
  {
    title: '360 Basketball',
    description:
      'Built a full web platform for a basketball agency — connecting players with teams, managing contracts, and securing new opportunities.',
    result: 'Live product with paying users',
    url: 'https://360-basketball-66d8df02.base44.app/',
    tag: 'Web App',
  },
  {
    title: 'Shades of the Soul',
    description:
      'Automated a creative process that took over 10 hours manually — reduced to under 1 hour with intelligent automation.',
    result: '10x faster workflow',
    url: 'https://shadesofthesoul.vercel.app/',
    tag: 'Automation',
  },
  {
    title: 'Drone Videographer',
    description:
      'Took a small business and created a professional landing page that converts visitors into real clients closing deals.',
    result: 'Real clients from day one',
    url: 'https://drone-videographer-landing.vercel.app/',
    tag: 'Landing Page',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12, ease: 'easeOut' },
  }),
};

export default function Testimonials() {
  return (
    <SectionWrapper id="testimonials" className="testimonials">
      <p className="section-label">OUR WORK</p>
      <h2 className="testimonials__heading">Projects We&apos;ve Shipped</h2>

      <div className="testimonials__grid">
        {projects.map((p, i) => (
          <motion.a
            key={p.title}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="testimonials__card testimonials__card--link"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            custom={i}
          >
            <div className="testimonials__card-header">
              <span className="testimonials__tag">{p.tag}</span>
              <svg className="testimonials__external-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </div>
            <h3 className="testimonials__name">{p.title}</h3>
            <p className="testimonials__text">{p.description}</p>
            <div className="testimonials__result">
              <span className="testimonials__result-dot" aria-hidden="true" />
              {p.result}
            </div>
          </motion.a>
        ))}
      </div>
    </SectionWrapper>
  );
}
