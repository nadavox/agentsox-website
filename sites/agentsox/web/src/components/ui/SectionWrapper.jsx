import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import './SectionWrapper.css';

export default function SectionWrapper({ id, children, className, background }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });

  return (
    <section
      id={id}
      ref={ref}
      className={`section-wrapper ${className || ''}`}
      style={background ? { background: `var(--color-${background})` } : undefined}
    >
      <motion.div
        className="section-inner"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </section>
  );
}
