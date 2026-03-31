import { useEffect } from 'react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import './LegalPage.css';

export default function LegalPage({ title, lastUpdated, children }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
