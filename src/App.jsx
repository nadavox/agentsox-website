import { lazy, Suspense, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { useTheme } from './hooks/useTheme';
import ThemeChooser from './components/ThemeChooser/ThemeChooser';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import ErrorBoundary from './components/ui/ErrorBoundary';

const Services = lazy(() => import('./components/Services'));
const Products = lazy(() => import('./components/Products'));
const About = lazy(() => import('./components/About'));
const Contact = lazy(() => import('./components/Contact'));
const PrivacyPolicy = lazy(() => import('./components/Legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/Legal/TermsOfService'));

function SectionSkeleton() {
  return (
    <div style={{
      padding: '4rem 1.5rem',
      maxWidth: 1200,
      margin: '0 auto',
    }}>
      <div style={{
        height: 12,
        width: 100,
        background: 'var(--color-border-subtle)',
        borderRadius: 4,
        marginBottom: 16,
      }} />
      <div style={{
        height: 32,
        width: '60%',
        background: 'var(--color-border-subtle)',
        borderRadius: 6,
        marginBottom: 12,
      }} />
      <div style={{
        height: 16,
        width: '40%',
        background: 'var(--color-border-subtle)',
        borderRadius: 4,
        opacity: 0.5,
      }} />
    </div>
  );
}

function AppContent() {
  const { hasChosen } = useTheme();
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    let timer;
    if (hasChosen && window.location.hash) {
      const id = window.location.hash.slice(1);
      // Small delay to let lazy sections render
      timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
    return () => clearTimeout(timer);
  }, [hasChosen]);

  if (path === '/privacy') {
    return (
      <Suspense fallback={<SectionSkeleton />}>
        <PrivacyPolicy />
      </Suspense>
    );
  }

  if (path === '/terms') {
    return (
      <Suspense fallback={<SectionSkeleton />}>
        <TermsOfService />
      </Suspense>
    );
  }

  return (
    <>
      <AnimatePresence>{!hasChosen && <ThemeChooser />}</AnimatePresence>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main-content">
        <Hero />
        <Suspense fallback={<SectionSkeleton />}><Services /></Suspense>
        <Suspense fallback={<SectionSkeleton />}><About /></Suspense>
        <Suspense fallback={<SectionSkeleton />}><Products /></Suspense>
        <Suspense fallback={<SectionSkeleton />}><Contact /></Suspense>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </ThemeProvider>
  );
}
