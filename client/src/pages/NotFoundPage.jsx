import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home, Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[65vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center glass-panel p-8 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-6 shadow-inner">
          <FileQuestion className="w-8 h-8" />
        </div>

        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
          Error 404
        </span>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-4 tracking-tight">
          Page Not Found
        </h1>

        <p className="text-sm text-slate-400 mt-3 leading-relaxed">
          The requested page or civic resource doesn&apos;t exist, or has been moved to another location.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-teal-500/20"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>

          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium text-sm border border-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}
