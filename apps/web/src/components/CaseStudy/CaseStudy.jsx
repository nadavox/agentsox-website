import Button from '../ui/Button';
import Footer from '../Footer';
import Navbar from '../Navbar';
import './CaseStudy.css';

export default function CaseStudy({ study }) {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main-content" className="case-study">
        <section className="case-study__hero">
          <div className="case-study__copy">
            <p className="section-label">{study.tag}</p>
            <h1>{study.title}</h1>
            <p className="case-study__lead">{study.description}</p>
            <div className="case-study__metric">
              <span>Result</span>
              <strong>{study.outcome}</strong>
            </div>
            <div className="case-study__actions">
              <Button href="/#contact">Build something similar</Button>
              <Button href={study.url} target="_blank" rel="noopener noreferrer" variant="ghost">
                View live work
              </Button>
            </div>
          </div>
          <div className="case-study__preview">
            <img
              src={study.preview}
              alt={study.previewAlt}
              width="1440"
              height="900"
              loading="lazy"
              decoding="async"
            />
          </div>
        </section>

        <section className="case-study__details">
          <article>
            <h2>What needed to change</h2>
            <p>{study.problem}</p>
          </article>
          <article>
            <h2>How we approached it</h2>
            <p>
              We started by clarifying the real workflow, the people using it,
              and the points where the system needed to be practical instead of impressive.
              That means visible handoffs, clear user paths, and a result the business can use.
            </p>
          </article>
          <article>
            <h2>What the client got</h2>
            <p>{study.outcome}. The same pattern applies to AI chatbots, workflow automation,
              owner dashboards, and lead follow-up systems built around real operations.</p>
          </article>
        </section>
      </main>
      <Footer />
    </>
  );
}
