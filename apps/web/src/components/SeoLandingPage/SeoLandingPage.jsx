import { CASE_STUDIES, CONTACT_EMAIL } from '../../data/siteContent';
import Button from '../ui/Button';
import Footer from '../Footer';
import Navbar from '../Navbar';
import '../Legal/LegalPage.css';
import './SeoLandingPage.css';

export default function SeoLandingPage({ page, type = 'service' }) {
  const relatedCases = CASE_STUDIES.slice(0, 3);

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main-content" className="seo-page">
        <section className="seo-page__hero">
          <p className="section-label">{page.eyebrow}</p>
          <h1>{page.title}</h1>
          <p className="seo-page__lead">{page.description}</p>
          <div className="seo-page__actions">
            <Button href="/#contact">Audit My Workflow</Button>
            <Button href={`mailto:${CONTACT_EMAIL}`} variant="ghost">Email AgentsOX</Button>
          </div>
        </section>

        <section className="seo-page__section">
          <div>
            <p className="section-label">{type === 'industry' ? 'USE CASES' : 'OUTCOMES'}</p>
            <h2>What This Should Fix</h2>
          </div>
          <div className="seo-page__grid">
            {page.outcomes.map((outcome) => (
              <article key={outcome} className="seo-page__item">
                <h3>{outcome}</h3>
                <p>
                  AgentsOX maps the existing tools, handoffs, and failure points first,
                  then builds the smallest useful system that can be trusted in daily use.
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="seo-page__section seo-page__section--split">
          <div>
            <p className="section-label">HOW WE BUILD</p>
            <h2>Practical, Bounded, and Easy to Hand Off</h2>
          </div>
          <div className="seo-page__copy">
            <p>
              The work starts with one workflow problem, not a generic AI product.
              We identify the current tools, the people involved, what must stay under
              human review, and what failure behavior should look like.
            </p>
            <p>
              The goal is a system your team can understand: clear intake, reliable
              routing, visible review points, and a recovery path when an API, model,
              form, or CRM step fails.
            </p>
          </div>
        </section>

        <section className="seo-page__section">
          <div>
            <p className="section-label">PROOF</p>
            <h2>Related Work</h2>
          </div>
          <div className="seo-page__case-grid">
            {relatedCases.map((study) => (
              <a key={study.slug} href={`/case-studies/${study.slug}`} className="seo-page__case">
                <span>{study.tag}</span>
                <h3>{study.title}</h3>
                <p>{study.outcome}</p>
              </a>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
