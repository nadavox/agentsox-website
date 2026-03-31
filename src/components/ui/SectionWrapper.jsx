import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './SectionWrapper.css';

export default function SectionWrapper({ id, children, className, background }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
        animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </section>
  );
}
