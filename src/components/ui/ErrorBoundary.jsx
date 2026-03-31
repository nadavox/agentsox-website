import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-primary)' }}>
          <h2>Something went wrong</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '1rem' }}>
            Please refresh the page or <a href="mailto:atlas@agentsox.com" style={{ color: 'var(--color-accent)' }}>contact us</a>.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
