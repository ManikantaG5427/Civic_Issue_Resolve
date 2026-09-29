import React from 'react';
import HealthChecker from '../components/HealthChecker';
import QueueRoadmap from '../components/QueueRoadmap';
import { Shield, Sparkles, Smartphone, ArrowUpRight, Terminal, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-8 py-4">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-8 sm:p-12 border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-teal-950/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Civic Issue Resolution Platform — MERN Stack Core</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Empowering Citizens & Cities with <span className="gradient-text">CivicResolve</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            A vertical-slice civic issue tracking engine built with Node.js, Express, MongoDB, React, 
            and designed for seamless React Native mobile companion integration.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Queue 0: Project Foundation</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <Smartphone className="w-4 h-4 text-sky-400" />
              <span>Mobile-Ready Shared REST API</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>RBAC Architecture Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Health Checker */}
      <HealthChecker />

      {/* Development Roadmap */}
      <QueueRoadmap />

      {/* Architecture & Core Standards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4 border border-teal-500/20">
            <Terminal className="w-5 h-5" />
          </div>
          <h4 className="text-base font-semibold text-white">Central Error Handling</h4>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Unified <code className="text-teal-300">AppError</code> and standardized API responses ensure reliable error formatting across web and mobile clients.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4 border border-sky-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <h4 className="text-base font-semibold text-white">Security & Strict CORS</h4>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Protected headers with Helmet, secure file handling, and cross-origin controls configured for local web and Expo mobile testing.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/20">
            <Smartphone className="w-5 h-5" />
          </div>
          <h4 className="text-base font-semibold text-white">Shared Backend Source</h4>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Single source of truth for both web dashboards and upcoming React Native field worker/citizen mobile apps.
          </p>
        </div>
      </div>
    </div>
  );
}
