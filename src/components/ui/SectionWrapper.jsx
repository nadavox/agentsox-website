import { motion } from 'framer-motion';
import './SectionWrapper.css';

export default function SectionWrapper({ id, children, className, background }) {
  return (
    <section
      id={id}
      className={`section-wrapper ${className || ''}`}
      style={background ? { background: `var(--color-${background})` } : undefined}
    >
      <motion.div
        className="section-inner"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </section>
  );
}
