import SectionWrapper from '../ui/SectionWrapper';
import { FAQ_ITEMS } from '../../data/siteContent';
import './Faq.css';

export default function Faq() {
  return (
    <SectionWrapper id="faq" className="faq">
      <h2 className="faq__heading">Questions clients usually ask</h2>
      <p className="faq__intro">
        Straight answers on how we work, what we build, and what a project looks
        like. Anything not here, the assistant in the corner can pick up.
      </p>

      <div className="faq__list">
        {FAQ_ITEMS.map((item) => (
          <details key={item.question} className="faq__item">
            <summary className="faq__question">
              <span>{item.question}</span>
              <svg
                className="faq__icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <p className="faq__answer">{item.answer}</p>
          </details>
        ))}
      </div>
    </SectionWrapper>
  );
}
