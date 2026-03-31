import { useForm, ValidationError } from '@formspree/react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionWrapper from '../ui/SectionWrapper';
import Button from '../ui/Button';
import './Contact.css';

const fieldVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, delay: i * 0.1, ease: 'easeOut' },
  }),
};

export default function Contact() {
  const [state, handleSubmit] = useForm('xwvwbekw');
  const isSubmitting = state.submitting;

  return (
    <SectionWrapper id="contact" className="contact" background="bg-secondary">
      <div className="contact__columns">
        <div className="contact__info">
          <p className="section-label">CONTACT</p>
          <h2 className="contact__heading">Let&apos;s Talk</h2>
          <p className="contact__text">
            Have a project in mind? Want to learn more about what we do? Drop us
            a message and we&apos;ll get back to you.
          </p>
          <a className="contact__email" href="mailto:atlas@agentsox.com">
            atlas@agentsox.com
          </a>
        </div>

        <div className="contact__form-wrapper">
          <AnimatePresence mode="wait">
            {state.succeeded ? (
              <motion.div
                key="success"
                className="contact__success"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <svg
                  className="contact__success-icon"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                <p className="contact__success-text">
                  Thanks! We&apos;ll be in touch.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                className="contact__form"
                onSubmit={handleSubmit}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ValidationError errors={state.errors} className="contact__error" />

                <motion.div
                  className="contact__field"
                  variants={fieldVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={0}
                >
                  <label className="contact__field-label" htmlFor="contact-name">
                    Name
                  </label>
                  <input
                    id="contact-name"
                    className="contact__input"
                    type="text"
                    name="name"
                    required
                    minLength={2}
                    disabled={isSubmitting}
                  />
                  <ValidationError prefix="Name" field="name" errors={state.errors} />
                </motion.div>

                <motion.div
                  className="contact__field"
                  variants={fieldVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={1}
                >
                  <label className="contact__field-label" htmlFor="contact-email">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    className="contact__input"
                    type="email"
                    name="email"
                    required
                    disabled={isSubmitting}
                  />
                  <ValidationError prefix="Email" field="email" errors={state.errors} />
                </motion.div>

                <motion.div
                  className="contact__field"
                  variants={fieldVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={2}
                >
                  <label className="contact__field-label" htmlFor="contact-message">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    className="contact__input contact__textarea"
                    name="message"
                    required
                    minLength={10}
                    rows={5}
                    disabled={isSubmitting}
                  />
                  <ValidationError prefix="Message" field="message" errors={state.errors} />
                </motion.div>

                {/* Honeypot */}
                <input
                  type="text"
                  name="_gotcha"
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />
                <input
                  type="hidden"
                  name="_subject"
                  value="New contact from agentsox.com"
                />

                <motion.div
                  variants={fieldVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={3}
                >
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="contact__submit"
                  >
                    {isSubmitting ? (
                      <span className="contact__spinner" aria-label="Sending" />
                    ) : (
                      'Send Message'
                    )}
                  </Button>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </SectionWrapper>
  );
}
