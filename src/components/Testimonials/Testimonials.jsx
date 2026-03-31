import { motion } from 'framer-motion';
import SectionWrapper from '../ui/SectionWrapper';
import './Testimonials.css';

const testimonials = [
  {
    quote:
      'AgentsOX handled our entire scheduling chaos. We went from 3 hours of admin per day to zero.',
    name: 'Sarah M.',
    role: 'Operations Lead',
  },
  {
    quote:
      'The communication routing is seamless. Our customers get instant responses and we never miss a message.',
    name: 'David K.',
    role: 'Founder',
  },
  {
    quote:
      'We tried building our own automation. Then we found AgentsOX and saved months of development time.',
    name: 'Lior T.',
    role: 'CTO',
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
      <p className="section-label">WHAT PEOPLE SAY</p>
      <h2 className="testimonials__heading">Trusted by Teams Who Ship</h2>

      <div className="testimonials__grid">
        {testimonials.map((t, i) => (
          <motion.blockquote
            key={t.name}
            className="testimonials__card"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            custom={i}
          >
            <span className="testimonials__quote-mark" aria-hidden="true">
              &ldquo;
            </span>
            <p className="testimonials__text">{t.quote}</p>
            <footer className="testimonials__author">
              <cite className="testimonials__name">{t.name}</cite>
              <span className="testimonials__role">{t.role}</span>
            </footer>
          </motion.blockquote>
        ))}
      </div>
    </SectionWrapper>
  );
}
