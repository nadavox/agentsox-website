import { motion } from 'framer-motion';
import SectionWrapper from '../ui/SectionWrapper';
import Button from '../ui/Button';
import './Products.css';

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const features = [
  '11 hands-on sections from mindset to mastery.',
  'Learn CLAUDE.md, Plan Mode, Skills & MCP.',
  'Build real projects with AI pair programming.',
];

export default function Products() {
  return (
    <SectionWrapper id="products" className="products">
      <p className="section-label">PRODUCTS</p>
      <h2 className="products__heading">Tools We've Built</h2>

      <motion.div
        className="products__card"
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        <div className="products__text">
          <span className="products__badge">WORKSHOP</span>
          <h3 className="products__name">Just Ask</h3>
          <p className="products__description">
            A hands-on workshop that takes you from zero to building real
            projects with Claude Code &mdash; no prior AI experience needed.
          </p>
          <ul className="products__features">
            {features.map((f) => (
              <li key={f} className="products__feature">{f}</li>
            ))}
          </ul>
          <Button
            href="https://just-ask.agentsox.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore Just Ask &rarr;
          </Button>
        </div>

        <div className="products__browser">
          <div className="products__browser-bar">
            <div className="products__browser-dots">
              <span className="products__browser-dot products__browser-dot--red" />
              <span className="products__browser-dot products__browser-dot--yellow" />
              <span className="products__browser-dot products__browser-dot--green" />
            </div>
            <span className="products__browser-url">just-ask.agentsox.com</span>
          </div>
          <div className="products__browser-content">
            <div className="products__browser-title">Just Ask</div>
            <div className="products__browser-subtitle">
              Master Claude Code in 11 hands-on sections
            </div>
            <div className="products__browser-decoration">
              <span className="products__browser-block" />
              <span className="products__browser-block" />
              <span className="products__browser-block" />
            </div>
          </div>
        </div>
      </motion.div>
    </SectionWrapper>
  );
}
