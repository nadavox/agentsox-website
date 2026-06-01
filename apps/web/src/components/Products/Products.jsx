import { motion } from 'framer-motion';
import SectionWrapper from '../ui/SectionWrapper';
import Button from '../ui/Button';
import './Products.css';

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const features = [
  'Bring one real workflow from your business.',
  'Leave with a reusable AI-assisted process.',
  'Learn where human review and safety checks belong.',
];

const tools = [
  'Workflow map',
  'AI assistant',
  'Human review',
  'Reusable process',
];

export default function Products() {
  return (
    <SectionWrapper id="products" className="products">
      <h2 className="products__heading">Workshops for Practical AI Adoption</h2>
      <p className="products__intro">
        Hands-on training for business teams that want to use AI safely in daily
        operations, not watch another generic demo.
      </p>

      <motion.div
        className="products__card"
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        <div className="products__text">
          <span className="products__badge">HANDS-ON WORKSHOP</span>
          <h3 className="products__name">Just Ask</h3>
          <p className="products__description">
            A hands-on workshop for owners and operators. Bring one workflow;
            leave with a working AI-assisted process your team can understand
            and reuse.
          </p>
          <div className="products__tool-list" aria-label="Workshop tools covered">
            {tools.map((tool) => (
              <span key={tool} className="products__tool">{tool}</span>
            ))}
          </div>
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
            Explore the Workshop{' '}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginLeft: '0.35rem', flexShrink: 0 }}>
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
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
            <div className="products__browser-kicker">Workshop Path</div>
            <div className="products__browser-title">Build Around One Real Workflow</div>
            <div className="products__browser-panel">
              <div>
                <span>01</span>
                Map the current manual process
              </div>
              <div>
                <span>02</span>
                Add AI where it reduces real work
              </div>
              <div>
                <span>03</span>
                Define review, handoff, and reuse
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </SectionWrapper>
  );
}
