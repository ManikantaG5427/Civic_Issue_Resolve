import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Star,
  Camera,
  Upload,
  RotateCcw,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { uploadAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const DISPUTE_REASONS = [
  { value: 'WORK_NOT_EXECUTED', labelKey: 'reason_work_not_done', defaultLabel: 'No Physical Work Done on Site' },
  { value: 'POOR_QUALITY_REPAIR', labelKey: 'reason_poor_quality', defaultLabel: 'Incomplete / Poor Quality Repair' },
  { value: 'HAZARD_REMAINS', labelKey: 'reason_hazard_remains', defaultLabel: 'Hazard or Unsafe Debris Still Present' },
  { value: 'WRONG_LOCATION', labelKey: 'reason_wrong_location', defaultLabel: 'Repair Performed at Incorrect Location' },
  { value: 'OTHER', labelKey: 'reason_other', defaultLabel: 'Other Operational Grievance' },
];

export default function CitizenResolutionModal({ issue, mode = 'confirm', onClose, onConfirm, onDispute }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(mode); // 'confirm' | 'dispute'
  
  // Confirmation state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  
  // Dispute state
  const [disputeReason, setDisputeReason] = useState(DISPUTE_REASONS[0].value);
  const [disputeComment, setDisputeComment] = useState('');
  const [disputePhotos, setDisputePhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    setUploadingPhotos(true);
    try {
      const uploadPromises = files.map((file) => uploadAPI.uploadImage(file));
      const results = await Promise.all(uploadPromises);
      const urls = results.map((r) => r.data?.url).filter(Boolean);
      setDisputePhotos((prev) => [...prev, ...urls]);
    } catch {
      setError('Failed to upload evidence photos. Please retry.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onConfirm({
        rating,
        feedback: feedbackText.trim(),
        comment: feedbackText.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to confirm resolution');
    } finally {
      setLoading(false);
    }
  };

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!disputeComment || disputeComment.trim().length < 10) {
      setError('Please provide a descriptive explanation of at least 10 characters why the issue is not fixed.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onDispute({
        disputeReason,
        reopenReason: disputeComment.trim(),
        reopenPhotos: disputePhotos,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative my-8 w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {activeTab === 'confirm' ? t('confirm_title') : t('dispute_title')}
            </h3>
            <p className="text-xs text-slate-500">
              Ticket <span className="font-mono font-semibold text-slate-700">{issue?.issueNumber}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-2 bg-slate-100 border-b border-slate-200">
          <button
            type="button"
            onClick={() => { setActiveTab('confirm'); setError(null); }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'confirm'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 size={16} className={activeTab === 'confirm' ? 'text-emerald-600' : ''} />
            {t('confirm_resolution_btn')}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('dispute'); setError(null); }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'dispute'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw size={16} className={activeTab === 'dispute' ? 'text-rose-600' : ''} />
            {t('dispute_resolution_btn')}
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'confirm' ? (
            <form onSubmit={handleConfirmSubmit} className="space-y-4">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 text-xs text-emerald-900">
                <p className="font-semibold mb-1">Thank you for validating this resolution!</p>
                <p className="text-emerald-700 text-[11px]">
                  Confirming this fix marks the ticket as officially Citizen-Confirmed and informs the municipal team that the defect was resolved to your satisfaction.
                </p>
              </div>

              {/* 5-Star Rating */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Rate Municipal Field Service Quality
                </label>
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 text-slate-300 transition hover:scale-110 focus:outline-none"
                    >
                      <Star
                        size={28}
                        className={`transition ${(hoverRating || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-slate-700">
                    {rating === 5 ? 'Excellent (5/5)' : rating === 4 ? 'Good (4/5)' : rating === 3 ? 'Satisfactory (3/5)' : rating === 2 ? 'Needs Improvement (2/5)' : 'Poor (1/5)'}
                  </span>
                </div>
              </div>

              {/* Citizen Feedback */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Citizen Notes / Praise (Optional)
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Share any comments regarding promptness, cleanliness, or workmanship..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
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
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 text-xs shadow-md shadow-emerald-600/20 transition"
                >
                  {loading ? 'Submitting...' : 'Confirm Resolution & Close'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleDisputeSubmit} className="space-y-4">
              <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3.5 text-xs text-rose-900">
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <ShieldAlert size={15} className="text-rose-600" /> Contestable Closure Protection
                </p>
                <p className="text-rose-700 text-[11px]">
                  If the problem was not adequately repaired, disputing will reopen the ticket and escalate it back to the supervisor and field crew with your feedback.
                </p>
              </div>

              {/* Dispute Reason Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('dispute_reason')} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
                >
                  {DISPUTE_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {t(r.labelKey) || r.defaultLabel}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mandatory Dispute Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Detailed Explanation <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={disputeComment}
                  onChange={(e) => setDisputeComment(e.target.value)}
                  placeholder={t('dispute_comments_placeholder')}
                  rows={3}
                  required
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
                />
              </div>

              {/* Optional Photo Proof */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('dispute_photos')}
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 flex items-center gap-2 transition">
                    <Camera size={15} />
                    <span>{uploadingPhotos ? 'Uploading...' : 'Choose Photos'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhotos}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {disputePhotos.length} photo(s) selected
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
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
                  disabled={loading || uploadingPhotos}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2 text-xs shadow-md shadow-rose-600/20 transition"
                >
                  {loading ? 'Submitting Dispute...' : t('submit_dispute')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
