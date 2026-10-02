import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CivicResolve Caught UI Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white rounded-2xl border border-red-200 shadow-soft p-6 sm:p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 font-heading">
                Something went wrong displaying this page
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {this.state.error?.message || 'An unexpected rendering error occurred.'}
              </p>
            </div>

            {this.state.error?.stack && (
              <details className="text-left bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-700 overflow-x-auto max-h-36">
                <summary className="cursor-pointer font-bold text-slate-800 mb-1">
                  View Technical Details
                </summary>
                <pre>{this.state.error.stack}</pre>
              </details>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold shadow-sm transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Back to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
