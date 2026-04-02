import { useEffect } from 'react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import './LegalPage.css';

export default function LegalPage({ title, lastUpdated, children }) {
  useEffect(() => {
    window.scrollTo(0, 0);
    const originalTitle = document.title;
    document.title = `${title} — AgentsOX`;
    const metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc?.getAttribute('content');
    if (metaDesc) metaDesc.setAttribute('content', `${title} for AgentsOX — AI agents for business automation.`);
    return () => {
      document.title = originalTitle;
      if (metaDesc && originalDesc) metaDesc.setAttribute('content', originalDesc);
    };
  }, [title]);

  return (
    <>
      <Navbar />
      <div className="legal-page">
        <div className="legal-page__header">
          <h1 className="legal-page__title">{title}</h1>
          {lastUpdated && <p className="legal-page__date">Last updated: {lastUpdated}</p>}
        </div>
        <div className="legal-page__content">
          {children}
        </div>
        <a href="/" className="legal-page__back">&larr; Back to AgentsOX</a>
      </div>
      <Footer />
    </>
  );
}
