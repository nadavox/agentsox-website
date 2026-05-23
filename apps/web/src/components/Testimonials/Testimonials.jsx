import { motion } from 'framer-motion';
import SectionWrapper from '../ui/SectionWrapper';
import { CASE_STUDIES } from '../../data/siteContent';
import './Testimonials.css';

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
      <p className="section-label">CLIENT WORK</p>
      <h2 className="testimonials__heading">Proof That We Execute</h2>
      <p className="testimonials__intro">
        Real projects delivered across web platforms, automation, and
        client-facing systems. The goal is always the same: turn a business
        problem into something working.
      </p>

      <div className="testimonials__grid">
        {CASE_STUDIES.map((p, i) => (
          <motion.a
            key={p.title}
            href={`/case-studies/${p.slug}`}
            className="testimonials__card testimonials__card--link"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            custom={i}
          >
            <div className="testimonials__preview">
              <img
                src={p.preview}
                alt={p.previewAlt}
                width="1440"
                height="900"
                loading="lazy"
              />
            </div>
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
              {p.metric}
            </div>
          </motion.a>
        ))}
      </div>
    </SectionWrapper>
  );
}
