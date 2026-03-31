import { lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { useTheme } from './hooks/useTheme';
import ThemeChooser from './components/ThemeChooser/ThemeChooser';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';

const Services = lazy(() => import('./components/Services'));
const Products = lazy(() => import('./components/Products'));
const About = lazy(() => import('./components/About'));
const Contact = lazy(() => import('./components/Contact'));

function AppContent() {
  const { hasChosen } = useTheme();

  return (
    <>
      <AnimatePresence>{!hasChosen && <ThemeChooser />}</AnimatePresence>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main-content">
        <Hero />
        <Suspense><Services /></Suspense>
        <Suspense><Products /></Suspense>
        <Suspense><About /></Suspense>
        <Suspense><Contact /></Suspense>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
