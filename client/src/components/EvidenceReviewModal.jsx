import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Eye,
  FileCheck,
  Building,
  ShieldCheck,
  Maximize2,
  Info,
  HelpCircle,
} from 'lucide-react';
import { getImageUrl } from '../services/api';

const CATEGORY_CHECKLISTS = {
  pothole: [
    'Original location-marked defect photo verified',
    'Post-repair smooth asphalt / concrete surface verified',
    'Road segment & landmark match original site',
    'Patching covers entire defect perimeter safely',
    'Materials & compaction notes documented',
  ],
  road: [
    'Original damaged road surface identified',
    'Post-resurfacing surface completed to grade',
    'Landmark and lane orientation match',
    'Debris and excess tar cleared from roadway',
  ],
  garbage: [
    'Original illegal dump / waste accumulation verified',
    'Post-cleanup ground cleared and sanitized',
    'Surrounding perimeter free of scattered litter',
    'Disposal / transport to transfer station noted',
  ],
  drainage: [
    'Original blockage / waterlogging captured',
    'Post-clearance silt / debris removed from channel',
    'Water flow unobstructed and verified',
    'Manhole / drain cover securely replaced',
  ],
  water: [
    'Pipeline leak point / defect verified',
    'Pipe joint repaired or valve replaced',
    'Leak-free pressure test confirmed',
    'Trench / excavation backfilled safely',
  ],
  streetlight: [
    'Pole ID and location context match',
    'Illuminated luminaire or physical functional check',
    'Wiring insulation and junction box secured',
    'Day/night operational circuit verified',
  ],
  sanitation: [
    'Sanitation facility cleaned & sanitized',
    'Privacy-safe evidence (no faces or people)',
    'Water supply and drainage fixtures functional',
  ],
  default: [
    'Initial defect photo compared with resolution proof',
    'Visual evidence confirms physical work executed',
    'Location and landmark consistency verified',
    'Work description & materials adequately documented',
  ],
};

const REASON_CODES = {
  approved: [
    { code: 'EVIDENCE_VERIFIED_COMPLETE', label: 'Evidence Verified Complete & Compliant' },
    { code: 'HIGH_QUALITY_REPAIR', label: 'High Quality Repair with Full Photographic Proof' },
    { code: 'STANDARD_RESOLUTION_CONFIRMED', label: 'Standard Resolution Checklist Satisfied' },
  ],
  rework_required: [
    { code: 'INCOMPLETE_REPAIR', label: 'Incomplete Repair (Visible Defect Remains)' },
    { code: 'INCORRECT_LOCATION', label: 'Photo Does Not Match Reported Location' },
    { code: 'POOR_WORKMANSHIP', label: 'Substandard Workmanship / Hazard Persists' },
    { code: 'DEBRIS_NOT_CLEARED', label: 'Debris / Excavation Not Safely Cleared' },
  ],
  more_evidence_required: [
    { code: 'LOW_QUALITY_PHOTO', label: 'Blurry, Dark or Low Quality Photo' },
    { code: 'MISSING_ANGLE', label: 'Missing Key Angle or Wide-Shot Context' },
    { code: 'MISSING_MATERIALS_LOG', label: 'Materials / Repair Details Unclear' },
  ],
  site_check_required: [
    { code: 'AMBIGUOUS_PHOTO_PROOF', label: 'Photographic Proof Inconclusive' },
    { code: 'SAFETY_CRITICAL_ASSET', label: 'Safety-Critical Asset Requiring Physical Test' },
  ],
};

export default function EvidenceReviewModal({ issue, onClose, onSubmitReview }) {
  const categoryCode = issue?.category?.code?.toLowerCase() || '';
  const categoryName = issue?.category?.name?.toLowerCase() || '';

  // Match category checklist
  let defaultItems = CATEGORY_CHECKLISTS.default;
  if (categoryCode.includes('pothole') || categoryName.includes('pothole') || categoryName.includes('road')) {
    defaultItems = CATEGORY_CHECKLISTS.pothole;
  } else if (categoryCode.includes('garbage') || categoryName.includes('garbage') || categoryName.includes('waste')) {
    defaultItems = CATEGORY_CHECKLISTS.garbage;
  } else if (categoryCode.includes('drain') || categoryName.includes('drain') || categoryName.includes('flood')) {
    defaultItems = CATEGORY_CHECKLISTS.drainage;
  } else if (categoryCode.includes('water') || categoryName.includes('water') || categoryName.includes('pipe')) {
    defaultItems = CATEGORY_CHECKLISTS.water;
  } else if (categoryCode.includes('street') || categoryName.includes('light') || categoryName.includes('electric')) {
    defaultItems = CATEGORY_CHECKLISTS.streetlight;
  } else if (categoryCode.includes('toilet') || categoryName.includes('sanitation')) {
    defaultItems = CATEGORY_CHECKLISTS.sanitation;
  }

  const [checklist, setChecklist] = useState(
    defaultItems.map((item) => ({ item, checked: false, notes: '' }))
  );
  const [outcome, setOutcome] = useState('approved');
  const [reasonCode, setReasonCode] = useState(REASON_CODES.approved[0].code);
  const [reviewerNote, setReviewerNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activePreview, setActivePreview] = useState(null);

  // Before photo (initial stage) & After photo (resolution stage)
  const initialPhotos = (issue.evidence || []).filter((e) => e.stage === 'initial' || !e.stage);
  const resolutionPhotos = (issue.evidence || []).filter((e) => e.stage === 'resolution' || e.stage === 'completion');
  const progressPhotos = (issue.evidence || []).filter((e) => e.stage === 'progress' || e.stage === 'starting' || e.stage === 'during');

  const beforePhoto = initialPhotos[0]?.url || issue.evidence?.[0]?.url;
  const afterPhoto = resolutionPhotos[0]?.url || issue.evidence?.[issue.evidence.length - 1]?.url;

  const handleToggleCheck = (index) => {
    setChecklist((prev) =>
      prev.map((c, i) => (i === index ? { ...c, checked: !c.checked } : c))
    );
  };

  const handleOutcomeChange = (newOutcome) => {
    setOutcome(newOutcome);
    if (REASON_CODES[newOutcome]?.length > 0) {
      setReasonCode(REASON_CODES[newOutcome][0].code);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reviewerNote || reviewerNote.trim().length < 5) {
      setError('Please provide a descriptive reviewer note (at least 5 characters).');
      return;
    }

    // Invariant check: If approving, warn if checklist items aren't reviewed
    const allChecked = checklist.every((c) => c.checked);
    if (outcome === 'approved' && !allChecked) {
      if (!window.confirm('Some evidence checklist items are unchecked. Do you still want to approve this resolution with a supervisor override?')) {
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmitReview({
        outcome,
        reasonCode,
        reviewerNote: reviewerNote.trim(),
        checklist,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit evidence review decision');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative my-8 w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2.5 text-white shadow-sm">
              <FileCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Independent Evidence Review</h3>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                  {issue.category?.name || 'Civic Issue'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Ticket <span className="font-mono font-semibold text-slate-700">{issue.issueNumber}</span> • Quality Inspection & Proof of Resolution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Side-by-Side Visual Inspection Box */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Eye size={15} className="text-blue-600" /> Side-by-Side Evidence Comparison
              </h4>
              <span className="text-xs text-slate-500">Click photo to view full size</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Before Photo */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                    BEFORE (Citizen Report)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {initialPhotos[0]?.uploadedAt ? new Date(initialPhotos[0].uploadedAt).toLocaleDateString() : 'Initial'}
                  </span>
                </div>
                {beforePhoto ? (
                  <div
                    onClick={() => setActivePreview(getImageUrl(beforePhoto))}
                    className="relative group aspect-video w-full rounded-lg overflow-hidden bg-slate-100 cursor-pointer border border-slate-200"
                  >
                    <img
                      src={getImageUrl(beforePhoto)}
                      alt="Before evidence"
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                      <Maximize2 size={24} />
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video flex flex-col items-center justify-center rounded-lg bg-slate-100 text-slate-400 text-xs">
                    <Info size={20} className="mb-1" />
                    No initial photo attached
                  </div>
                )}
              </div>

              {/* After Photo */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                    AFTER (Field Worker Proof)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {resolutionPhotos[0]?.uploadedAt ? new Date(resolutionPhotos[0].uploadedAt).toLocaleDateString() : 'Completion'}
                  </span>
                </div>
                {afterPhoto ? (
                  <div
                    onClick={() => setActivePreview(getImageUrl(afterPhoto))}
                    className="relative group aspect-video w-full rounded-lg overflow-hidden bg-slate-100 cursor-pointer border border-slate-200"
                  >
                    <img
                      src={getImageUrl(afterPhoto)}
                      alt="After resolution proof"
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                      <Maximize2 size={24} />
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video flex flex-col items-center justify-center rounded-lg bg-slate-100 text-slate-400 text-xs">
                    <AlertTriangle size={20} className="mb-1 text-amber-500" />
                    No completion photo uploaded
                  </div>
                )}
              </div>
            </div>

            {/* Additional gallery if more than 2 photos exist */}
            {(initialPhotos.length > 1 || resolutionPhotos.length > 1 || progressPhotos.length > 0) && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Additional Stage & Progress Photos ({issue.evidence?.length || 0} total):
                </span>
                <div className="flex gap-2 mt-1.5 overflow-x-auto pb-1">
                  {issue.evidence?.map((ev, i) => (
                    <img
                      key={i}
                      src={getImageUrl(ev.url)}
                      alt={`Evidence ${i}`}
                      onClick={() => setActivePreview(getImageUrl(ev.url))}
                      className="h-14 w-14 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-80 transition shrink-0"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Category-Specific Verification Checklist */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" /> Category Compliance Checklist ({issue.category?.name || 'General'})
              </h4>
              <span className="text-xs font-semibold text-slate-500">
                {checklist.filter((c) => c.checked).length} of {checklist.length} verified
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Check off each verification criterion verified against the uploaded photographic evidence and location metadata.
            </p>

            <div className="space-y-2.5">
              {checklist.map((item, idx) => (
                <label
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                    item.checked
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                      : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100/60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleToggleCheck(idx)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-semibold">{item.item}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Review Decision Selector */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Review Decision
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOutcomeChange('approved')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                    outcome === 'approved'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 size={20} className="mb-1" />
                  <span className="text-xs font-bold">Approve Evidence</span>
                  <span className="text-[10px] opacity-80">Send to citizen</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOutcomeChange('rework_required')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                    outcome === 'rework_required'
                      ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <RotateCcw size={20} className="mb-1" />
                  <span className="text-xs font-bold">Require Rework</span>
                  <span className="text-[10px] opacity-80">Return to crew</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOutcomeChange('more_evidence_required')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                    outcome === 'more_evidence_required'
                      ? 'bg-amber-600 border-amber-600 text-white shadow-md shadow-amber-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <HelpCircle size={20} className="mb-1" />
                  <span className="text-xs font-bold">More Evidence</span>
                  <span className="text-[10px] opacity-80">Request details</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOutcomeChange('site_check_required')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                    outcome === 'site_check_required'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Building size={20} className="mb-1" />
                  <span className="text-xs font-bold">Site Inspection</span>
                  <span className="text-[10px] opacity-80">Schedule physical check</span>
                </button>
              </div>
            </div>

            {/* Reason Code Dropdown */}
            {REASON_CODES[outcome] && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Standard Evaluation Reason Code
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {REASON_CODES[outcome].map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label} ({r.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Mandatory Reviewer Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Reviewer Evaluation Notes <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={reviewerNote}
                onChange={(e) => setReviewerNote(e.target.value)}
                placeholder="Explain the evaluation rationale, specific work quality observations, or corrective action needed..."
                rows={3}
                required
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 shadow-xs placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-md transition ${
                  outcome === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    : outcome === 'rework_required'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                }`}
              >
                {loading ? 'Submitting Review...' : `Confirm Decision: ${outcome.replace('_', ' ').toUpperCase()}`}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Fullscreen Photo Zoom Modal */}
      {activePreview && (
        <div
          onClick={() => setActivePreview(null)}
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4 cursor-pointer"
        >
          <img
            src={activePreview}
            alt="Enlarged preview"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
