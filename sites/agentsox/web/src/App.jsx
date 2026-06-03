import { lazy, Suspense, useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import ErrorBoundary from './components/ui/ErrorBoundary';
import BackToTop from './components/ui/BackToTop';
import { CASE_STUDIES, HOME_META, INDUSTRY_PAGES, SERVICE_PAGES, SITE_URL } from './data/siteContent';

const Services = lazy(() => import('./components/Services'));
const Products = lazy(() => import('./components/Products'));
const About = lazy(() => import('./components/About'));
const Testimonials = lazy(() => import('./components/Testimonials'));
const Faq = lazy(() => import('./components/Faq'));
const Contact = lazy(() => import('./components/Contact'));
const SeoLandingPage = lazy(() => import('./components/SeoLandingPage'));
const CaseStudy = lazy(() => import('./components/CaseStudy'));
const PrivacyPolicy = lazy(() => import('./components/Legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/Legal/TermsOfService'));
const NotFound = lazy(() => import('./components/NotFound'));
// The FAQ chat is now the shared widget product, embedded via a <script> in
// index.html (siteId=agentsox-main) - we dogfood it like any client.

const ROUTE_META = new Map([
  ['/', HOME_META],
  ['/privacy', {
    title: 'Privacy Policy | AgentsOX',
    description: 'Privacy Policy for AgentsOX AI chatbots, workflow automation, workshops, analytics, and website contact workflows.',
  }],
  ['/terms', {
    title: 'Terms of Service | AgentsOX',
    description: 'Terms of Service for AgentsOX website use, AI workshops, automation services, client work, disclaimers, and limitations.',
  }],
  ...SERVICE_PAGES.map((page) => [`/${page.slug}`, {
    title: `${page.title} | AgentsOX`,
    description: page.metaDescription,
  }]),
  ...INDUSTRY_PAGES.map((page) => [`/${page.slug}`, {
    title: `${page.title} | AgentsOX`,
    description: page.metaDescription,
  }]),
  ...CASE_STUDIES.map((study) => [`/case-studies/${study.slug}`, {
    title: `${study.title} Case Study | AgentsOX`,
    description: `${study.description} Result: ${study.outcome}.`,
  }]),
]);

function getCurrentPath() {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname;
}

function updateMeta(path) {
  if (typeof document === 'undefined') return;
  const meta = ROUTE_META.get(path) || {
    title: 'Page Not Found | AgentsOX',
    description: 'AgentsOX designs custom AI automation, internal tools, branding, SEO, and business systems around real workflows.',
  };
  document.title = meta.title;

  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute('content', meta.description);

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute('href', `${SITE_URL}${path === '/' ? '' : path}`);
}

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
  const [path, setPath] = useState(getCurrentPath);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    updateMeta(path);
  }, [path]);

  useEffect(() => {
    let timer;
    if (typeof window !== 'undefined' && window.location.hash) {
      const id = window.location.hash.slice(1);
      // Small delay to let lazy sections render
      timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
    return () => clearTimeout(timer);
  }, []);

  const servicePage = SERVICE_PAGES.find((page) => path === `/${page.slug}`);
  if (servicePage) {
    return (
      <Suspense fallback={<SectionSkeleton />}>
        <SeoLandingPage page={servicePage} type="service" />
      </Suspense>
    );
  }

  const industryPage = INDUSTRY_PAGES.find((page) => path === `/${page.slug}`);
  if (industryPage) {
    return (
      <Suspense fallback={<SectionSkeleton />}>
        <SeoLandingPage page={industryPage} type="industry" />
      </Suspense>
    );
  }

  const caseStudy = CASE_STUDIES.find((study) => path === `/case-studies/${study.slug}`);
  if (caseStudy) {
    return (
      <Suspense fallback={<SectionSkeleton />}>
        <CaseStudy study={caseStudy} />
      </Suspense>
    );
  }

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

  if (path !== '/') {
    return (
      <Suspense fallback={<SectionSkeleton />}>
        <NotFound />
      </Suspense>
    );
  }

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main-content">
        <Hero />
        <Suspense fallback={<SectionSkeleton />}><Services /></Suspense>
        <Suspense fallback={<SectionSkeleton />}><About /></Suspense>
        <Suspense fallback={<SectionSkeleton />}><Testimonials /></Suspense>
        <Suspense fallback={<SectionSkeleton />}><Products /></Suspense>
        <Suspense fallback={<SectionSkeleton />}><Faq /></Suspense>
        <Suspense fallback={<SectionSkeleton />}><Contact /></Suspense>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </MotionConfig>
    </ThemeProvider>
  );
}
