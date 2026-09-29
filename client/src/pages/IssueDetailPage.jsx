import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  MapPin,
  FileText,
  Copy,
  Check,
  Building2,
  HardHat,
  User,
  ShieldCheck,
  ImageIcon,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { issueAPI } from '../services/api';
import Timeline from '../components/Timeline';
import MapPreview from '../components/MapPreview';

const getStatusDetails = (status) => {
  switch (status) {
    case 'submitted':
      return {
        label: 'Submitted',
        desc: 'Your issue report has been recorded and is queued for administrative review.',
        color: 'bg-sky-500/10 text-sky-300 border-sky-500/30 ring-sky-500/20',
      };
    case 'in_review':
      return {
        label: 'Under Review',
        desc: 'An administrator is verifying details and assigning the responsible municipal department.',
        color: 'bg-purple-500/10 text-purple-300 border-purple-500/30 ring-purple-500/20',
      };
    case 'assigned':
      return {
        label: 'Worker Assigned',
        desc: 'A field worker has been dispatched to inspect and address this issue.',
        color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 ring-indigo-500/20',
      };
    case 'in_progress':
      return {
        label: 'Work In Progress',
        desc: 'Field team is actively executing repairs on site.',
        color: 'bg-amber-500/10 text-amber-300 border-amber-500/30 ring-amber-500/20',
      };
    case 'resolved_verification_pending':
      return {
        label: 'Resolved (Pending Confirmation)',
        desc: 'Work is marked resolved by field personnel with photo proof. Citizen verification requested.',
        color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 ring-emerald-500/20',
      };
    case 'closed':
      return {
        label: 'Closed & Confirmed',
        desc: 'Resolution has been confirmed and the ticket is officially closed.',
        color: 'bg-slate-800 text-slate-300 border-slate-700 ring-slate-700/20',
      };
    case 'rejected':
      return {
        label: 'Rejected',
        desc: 'Issue could not be processed. Review administrative notes below for reason.',
        color: 'bg-rose-500/10 text-rose-300 border-rose-500/30 ring-rose-500/20',
      };
    default:
      return {
        label: status || 'Unknown',
        desc: 'Current workflow state.',
        color: 'bg-slate-800 text-slate-300 border-slate-700 ring-slate-700/20',
      };
  }
};

export default function IssueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    async function loadIssue() {
      setLoading(true);
      setError(null);
      try {
        const res = await issueAPI.getIssueById(id);
        if (res.data) {
          setIssue(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load civic issue details');
      } finally {
        setLoading(false);
      }
    }
    loadIssue();
  }, [id]);

  const handleCopyTicket = () => {
    if (!issue?.issueNumber) return;
    navigator.clipboard.writeText(issue.issueNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-800 rounded"></div>
        <div className="h-24 bg-slate-900 rounded-2xl border border-slate-800"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="h-48 bg-slate-900 rounded-2xl border border-slate-800"></div>
            <div className="h-64 bg-slate-900 rounded-2xl border border-slate-800"></div>
          </div>
          <div className="h-96 bg-slate-900 rounded-2xl border border-slate-800"></div>
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Issue Not Found or Restricted</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            {error || "We couldn't locate this civic ticket or you do not have permission to view it."}
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
          >
            Go Back
          </button>
          <Link
            to="/my-reports"
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-semibold transition"
          >
            My Reports
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusDetails(issue.status);
  const [lng, lat] = issue.location?.coordinates || [78.3967, 17.4849];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/my-reports"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-teal-400 transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to My Reports</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyTicket}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white transition"
            title="Copy Ticket ID"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-teal-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>{issue.issueNumber}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 relative overflow-hidden shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-teal-400 bg-teal-500/10 px-3 py-1 rounded-lg border border-teal-500/20">
              {issue.issueNumber}
            </span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ring-2 ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
            <span className="text-xs uppercase font-semibold px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
              Priority: {issue.priority || 'medium'}
            </span>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>
              Reported on{' '}
              {new Date(issue.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {issue.title}
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
            {statusInfo.desc}
          </p>
        </div>
      </div>

      {/* Main Grid: Details + Resolution Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Issue Description, Evidence, Location */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Description */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-400" />
              Issue Description
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
              {issue.description}
            </p>
          </div>

          {/* Evidence Photos Gallery */}
          {issue.evidence && issue.evidence.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-teal-400" />
                  Attached Photo Evidence ({issue.evidence.length})
                </h2>
                <span className="text-xs text-slate-400">Click to expand</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {issue.evidence.map((img, idx) => (
                  <button
                    key={img.url || idx}
                    type="button"
                    onClick={() => setSelectedPhoto(img.url)}
                    className="group relative aspect-video rounded-xl overflow-hidden border border-slate-800 hover:border-teal-500/50 transition bg-slate-950"
                  >
                    <img
                      src={img.url}
                      alt={img.caption || `Evidence photo ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <ExternalLink className="w-5 h-5 text-white" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Location & Map */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-400" />
              Location & Geotag Details
            </h2>

            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-start gap-2 text-slate-300">
                <strong className="text-slate-400 w-24 flex-shrink-0">Address:</strong>
                <span>{issue.location?.address || 'Kukatpally, Hyderabad'}</span>
              </div>

              {issue.location?.landmark && (
                <div className="flex items-start gap-2 text-slate-300">
                  <strong className="text-slate-400 w-24 flex-shrink-0">Landmark:</strong>
                  <span className="text-teal-300 font-medium">{issue.location.landmark}</span>
                </div>
              )}

              <div className="flex items-start gap-2 text-slate-300">
                <strong className="text-slate-400 w-24 flex-shrink-0">GPS Coordinates:</strong>
                <span className="font-mono text-xs text-slate-400">
                  {lat.toFixed(6)}, {lng.toFixed(6)}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <MapPreview latitude={lat} longitude={lng} height="220px" zoom={16} />
            </div>
          </div>
        </div>

        {/* Right Column: Municipal Assignment & Vertical Timeline */}
        <div className="space-y-6">
          {/* Assignment & Department Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
              Department & Assignment
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Assigned Department</span>
                  <span className="font-medium text-slate-200">
                    {issue.department?.name || 'Under Department Routing'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <HardHat className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Field Worker</span>
                  <span className="font-medium text-slate-200">
                    {issue.assignedWorker?.name || 'Awaiting Field Dispatch'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Service Area</span>
                  <span className="font-medium text-slate-200">
                    {issue.serviceArea?.name || 'Kukatpally Pilot Area'} (
                    {issue.serviceArea?.code || 'HYD-KPK'})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Resolution Timeline */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-400" />
                Resolution Timeline
              </h3>
              <span className="text-[11px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                Audit Trail
              </span>
            </div>

            <Timeline items={issue.timeline || []} />
          </div>
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-3xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto}
              alt="Expanded evidence preview"
              className="max-h-[85vh] w-auto rounded-2xl border border-slate-700 shadow-2xl object-contain"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="mt-3 block mx-auto px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
