import React from 'react';
import { Layers, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-850 bg-slate-950/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-teal-400" />
            <span>CivicResolve Platform</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Local-First MERN Architecture</span>
          </div>

          <div className="flex items-center space-x-6 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
              Role-Based Security Ready
            </span>
            <span>React Native / Mobile Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
