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
              <Button href="/#contact">Build Something Similar</Button>
              <Button href={study.url} target="_blank" rel="noopener noreferrer" variant="ghost">
                View Live Work
              </Button>
            </div>
          </div>
          <div className="case-study__preview">
            <img
              src={study.preview}
              alt={study.previewAlt}
              width="1440"
              height="900"
            />
          </div>
        </section>

        <section className="case-study__details">
          <article>
            <p className="section-label">PROBLEM</p>
            <h2>What Needed to Change</h2>
            <p>{study.problem}</p>
          </article>
          <article>
            <p className="section-label">APPROACH</p>
            <h2>How AgentsOX Thinks About This Work</h2>
            <p>
              The project started by clarifying the real workflow, the people using it,
              and the points where the system needed to be practical instead of impressive.
              That means visible handoffs, clear user paths, and a result the business can use.
            </p>
          </article>
          <article>
            <p className="section-label">OUTCOME</p>
            <h2>What the Client Got</h2>
            <p>{study.outcome}. The same pattern applies to AI chatbots, workflow automation,
              owner dashboards, and lead follow-up systems built around real operations.</p>
          </article>
        </section>
      </main>
      <Footer />
    </>
  );
}
