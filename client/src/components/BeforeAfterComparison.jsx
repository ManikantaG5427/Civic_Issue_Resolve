import React, { useState } from 'react';
import { ImageIcon, CheckCircle2, AlertCircle, ExternalLink, Layers } from 'lucide-react';
import { getImageUrl } from '../services/api.js';

export default function BeforeAfterComparison({ evidence = [], onExpandPhoto }) {
  const initialPhotos = evidence.filter((e) => !e.stage || e.stage === 'initial');
  const resolutionPhotos = evidence.filter((e) => e.stage === 'resolution');

  const [activeTab, setActiveTab] = useState('comparison'); // 'comparison' | 'all'

  if (!evidence || evidence.length === 0) {
    return null;
  }

  const hasResolution = resolutionPhotos.length > 0;

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-soft">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-civic-50 text-civic-700 border border-civic-200">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-heading">
              <span>Visual Resolution Evidence & Proof</span>
              {hasResolution && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Fix Attached
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              {hasResolution
                ? 'Compare original reported condition against verified field repair photos.'
                : 'Initial photographic evidence submitted during report creation.'}
            </p>
          </div>
        </div>

        {hasResolution && (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'comparison'
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Before & After View
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'all'
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
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
          <div className="space-y-3 p-4 rounded-xl bg-red-50/50 border border-red-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Before: Reported Condition ({initialPhotos.length})
              </span>
              <span className="text-xs text-slate-500">Citizen Submission</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {initialPhotos.map((img, i) => (
                <button
                  key={img.url || i}
                  type="button"
                  onClick={() => onExpandPhoto?.(getImageUrl(img.url))}
                  className="group relative aspect-video rounded-lg overflow-hidden border border-red-200 bg-slate-100 hover:border-red-400 transition"
                >
                  <img
                    src={getImageUrl(img.url)}
                    alt="Initial condition"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <ExternalLink className="w-4 h-4 text-white" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* After Column */}
          <div className="space-y-3 p-4 rounded-xl bg-green-50/50 border border-green-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-green-700 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />
                After: Resolution Proof ({resolutionPhotos.length})
              </span>
              <span className="text-xs text-green-700 font-medium">Field Worker Fix</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {resolutionPhotos.map((img, i) => (
                <button
                  key={img.url || i}
                  type="button"
                  onClick={() => onExpandPhoto?.(getImageUrl(img.url))}
                  className="group relative aspect-video rounded-lg overflow-hidden border border-green-200 bg-slate-100 hover:border-green-400 transition"
                >
                  <img
                    src={getImageUrl(img.url)}
                    alt="Resolution proof"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
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
                onClick={() => onExpandPhoto?.(getImageUrl(img.url))}
                className={`group relative aspect-video rounded-lg overflow-hidden border transition bg-slate-100 ${
                  isRes
                    ? 'border-green-300 hover:border-green-500'
                    : isProg
                    ? 'border-amber-300 hover:border-amber-500'
                    : 'border-slate-200 hover:border-brand-300'
                }`}
              >
                <img
                  src={getImageUrl(img.url)}
                  alt={img.filename || `Evidence photo ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <span
                  className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    isRes
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : isProg
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-white text-slate-700 border border-slate-200 shadow-sm'
                  }`}
                >
                  {isRes ? 'Fix Proof' : isProg ? 'In Progress' : 'Initial'}
                </span>
                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
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
