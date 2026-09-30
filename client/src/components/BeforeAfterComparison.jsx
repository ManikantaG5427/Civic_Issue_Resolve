import React, { useState } from 'react';
import { ImageIcon, CheckCircle2, AlertCircle, ExternalLink, Sparkles, Layers } from 'lucide-react';

export default function BeforeAfterComparison({ evidence = [], onExpandPhoto }) {
  const initialPhotos = evidence.filter((e) => !e.stage || e.stage === 'initial');
  const progressPhotos = evidence.filter((e) => e.stage === 'progress');
  const resolutionPhotos = evidence.filter((e) => e.stage === 'resolution');

  const [activeTab, setActiveTab] = useState('comparison'); // 'comparison' | 'all'

  if (!evidence || evidence.length === 0) {
    return null;
  }

  const hasResolution = resolutionPhotos.length > 0;

  return (
    <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Visual Resolution Evidence & Proof
              {hasResolution && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Fix Attached
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              {hasResolution
                ? 'Compare original reported condition against verified field repair photos.'
                : 'Initial photographic evidence submitted during report creation.'}
            </p>
          </div>
        </div>

        {hasResolution && (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'comparison'
                  ? 'bg-teal-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Before & After View
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'all'
                  ? 'bg-teal-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Photos ({evidence.length})
            </button>
          </div>
        )}
      </div>

      {/* Side by Side Comparative Mode */}
      {hasResolution && activeTab === 'comparison' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Before Column */}
          <div className="space-y-3 p-4 rounded-2xl bg-rose-950/10 border border-rose-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Before: Reported Condition ({initialPhotos.length})
              </span>
              <span className="text-[11px] text-slate-400">Citizen Submission</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {initialPhotos.map((img, i) => (
                <button
                  key={img.url || i}
                  type="button"
                  onClick={() => onExpandPhoto?.(img.url)}
                  className="group relative aspect-video rounded-xl overflow-hidden border border-rose-500/20 bg-slate-950 hover:border-rose-400 transition"
                >
                  <img
                    src={img.url}
                    alt="Initial condition"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <ExternalLink className="w-4 h-4 text-white" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* After Column */}
          <div className="space-y-3 p-4 rounded-2xl bg-emerald-950/10 border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                After: Resolution Proof ({resolutionPhotos.length})
              </span>
              <span className="text-[11px] text-emerald-400/80 font-medium">Field Worker Fix</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {resolutionPhotos.map((img, i) => (
                <button
                  key={img.url || i}
                  type="button"
                  onClick={() => onExpandPhoto?.(img.url)}
                  className="group relative aspect-video rounded-xl overflow-hidden border border-emerald-500/30 bg-slate-950 hover:border-emerald-400 transition ring-1 ring-emerald-500/20"
                >
                  <img
                    src={img.url}
                    alt="Resolution proof"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <ExternalLink className="w-4 h-4 text-white" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Standard Gallery View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {evidence.map((img, idx) => {
            const isRes = img.stage === 'resolution';
            const isProg = img.stage === 'progress';

            return (
              <button
                key={img.url || idx}
                type="button"
                onClick={() => onExpandPhoto?.(img.url)}
                className={`group relative aspect-video rounded-xl overflow-hidden border transition bg-slate-950 ${
                  isRes
                    ? 'border-emerald-500/40 hover:border-emerald-400 ring-1 ring-emerald-500/20'
                    : isProg
                    ? 'border-amber-500/40 hover:border-amber-400'
                    : 'border-slate-800 hover:border-teal-500/50'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.filename || `Evidence photo ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <span
                  className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-md ${
                    isRes
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                      : isProg
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-950/80 text-slate-300 border border-slate-700'
                  }`}
                >
                  {isRes ? 'Fix Proof' : isProg ? 'In Progress' : 'Initial'}
                </span>
                <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-white" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
