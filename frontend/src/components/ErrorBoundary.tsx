import React, { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
        <h2 style={{ marginBottom: 8 }}>Something went wrong</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 420, lineHeight: 1.6 }}>
          An unexpected error occurred. Please refresh the page or contact support if the issue persists.
        </p>
        {import.meta.env.DEV && this.state.error && (
          <pre style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-red)', borderRadius: 8, padding: '12px 16px', fontSize: '0.75rem', color: 'var(--accent-red)', textAlign: 'left', maxWidth: 600, overflow: 'auto', marginBottom: 24 }}>
            {this.state.error.message}
          </pre>
        )}
        <button className="btn btn-primary" onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/dashboard'; }}>
          Reload App
        </button>
      </div>
    );
  }
}
