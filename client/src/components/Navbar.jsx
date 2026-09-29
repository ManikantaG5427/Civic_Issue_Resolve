import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, Activity, GitBranch } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Civic<span className="text-teal-400">Resolve</span>
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-400 block -mt-1">
                Resolution Platform
              </span>
            </div>
          </Link>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
            Queue 0 · Foundation
          </span>
        </div>

        <nav className="flex items-center space-x-4">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/' ? 'text-teal-400' : 'text-slate-300 hover:text-white'
            }`}
          >
            Overview
          </Link>
          <Link
            to="/non-existent-page"
            className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            404 Test
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <GitBranch className="w-3.5 h-3.5 text-teal-400" />
            <span>MERN Stack</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
