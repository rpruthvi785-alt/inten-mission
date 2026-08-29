'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Global React Error Boundary — catches any unhandled render/component errors
 * and shows a friendly recovery UI instead of a blank white screen.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log for debugging — never expose to user in production
    console.error('[ErrorBoundary] Caught unhandled error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;

      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
          <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 shadow-lg p-8 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-rose-50 text-rose-600 rounded-full mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              The Three-Way Match Engine encountered an unexpected error. This is likely a temporary issue.
            </p>
            {this.state.error && (
              <div className="mb-6 p-3 bg-slate-900 text-rose-300 rounded-lg text-left text-[11px] font-mono overflow-auto max-h-28">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
            <p className="text-xs text-slate-400 mt-4">
              If this keeps happening, check that the backend is running on{' '}
              <code className="font-mono text-indigo-600">http://localhost:5000</code>
            </p>
          </div>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}
