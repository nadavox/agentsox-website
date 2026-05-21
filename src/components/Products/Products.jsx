import { motion } from 'framer-motion';
import SectionWrapper from '../ui/SectionWrapper';
import Button from '../ui/Button';
import './Products.css';

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const features = [
  'Claude Code, ChatGPT, MCP, prompts, and agent workflows.',
  'Build a real internal tool during the workshop.',
  'Turn AI usage into a repeatable team workflow.',
];

const tools = [
  'Claude Code',
  'ChatGPT',
  'MCP',
  'Agents',
];

export default function Products() {
  return (
    <SectionWrapper id="products" className="products">
      <p className="section-label">WORKSHOPS &amp; TRAINING</p>
      <h2 className="products__heading">AI Tool Workshops for Teams</h2>
      <p className="products__intro">
        Practical training for teams that want to use AI tools seriously, from
        daily development workflows to internal automation.
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
            A hands-on workshop for operators, founders, and builders who want
            to work with AI tools in production-like workflows, not just watch
            demos.
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
            <div className="products__browser-title">Build With AI Tools</div>
            <div className="products__browser-panel">
              <div>
                <span>01</span>
                Claude Code project setup
              </div>
              <div>
                <span>02</span>
                Prompt, plan, and execute safely
              </div>
              <div>
                <span>03</span>
                Ship a working internal tool
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </SectionWrapper>
  );
}
