import Navbar from '../Navbar';
import Footer from '../Footer';
import Button from '../ui/Button';
import './NotFound.css';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="not-found">
        <h1 className="not-found__code">404</h1>
        <h2 className="not-found__title">Page not found</h2>
        <p className="not-found__text">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Button href="/" variant="primary" className="not-found__cta">
          Back to Home
        </Button>
      </main>
      <Footer />
    </>
  );
}
