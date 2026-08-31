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

import { getApiBaseUrl } from '../lib/api';

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

      const apiUrl = typeof window !== 'undefined' ? getApiBaseUrl() : '';

      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 text-white">
          <div className="max-w-md w-full bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-6 sm:p-8 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mb-5 leading-relaxed">
              The Three-Way Match Engine encountered an unexpected error.
            </p>
            {this.state.error && (
              <div className="mb-5 p-3 bg-slate-950 border border-slate-800 text-rose-300 rounded-xl text-left text-xs font-mono overflow-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
            {apiUrl && (
              <p className="text-[11px] text-slate-500 mt-4 truncate">
                Backend API: <code className="font-mono text-indigo-400">{apiUrl}</code>
              </p>
            )}
          </div>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}

