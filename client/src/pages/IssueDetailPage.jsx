import React, { useState, useEffect, useCallback } from 'react';
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
  ShieldAlert,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Send,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { issueAPI, adminAPI, configAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Timeline from '../components/Timeline';
import MapPreview from '../components/MapPreview';

const REJECTION_CATEGORIES = [
  { value: 'jurisdiction', label: 'Out of Municipal Pilot Jurisdiction' },
  { value: 'duplicate', label: 'Duplicate Civic Report' },
  { value: 'insufficient_evidence', label: 'Insufficient Evidence / Unlocatable' },
  { value: 'private_property', label: 'Private Property / Non-Civic Matter' },
  { value: 'inappropriate', label: 'Inappropriate Content or Spam' },
  { value: 'other', label: 'Other Operational Constraint' },
];

const getStatusDetails = (status) => {
  switch (status) {
    case 'submitted':
      return {
        label: 'Submitted',
        desc: 'Issue report has been recorded and is queued for administrative verification & triage.',
        color: 'bg-sky-500/10 text-sky-300 border-sky-500/30 ring-sky-500/20',
      };
    case 'in_review':
      return {
        label: 'Under Review & Verified',
        desc: 'Administrator has verified the report. Ready for municipal department and worker dispatch.',
        color: 'bg-purple-500/10 text-purple-300 border-purple-500/30 ring-purple-500/20',
      };
    case 'assigned':
      return {
        label: 'Worker Assigned & Dispatched',
        desc: 'Assigned to field worker with active SLA target deadline.',
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
        desc: 'Issue could not be processed. Review administrative notes below for the verified reason.',
        color: 'bg-rose-500/10 text-rose-300 border-rose-500/30 ring-rose-500/20',
      };
    case 'info_requested':
      return {
        label: 'Clarification Requested',
        desc: 'Administrator has requested additional details or photo proof from the reporting citizen.',
        color: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30 ring-yellow-500/20',
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
  const { user } = useAuth();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Admin Triage Modal States (Queue 9 & 10)
  const [triageModal, setTriageModal] = useState(null); // 'verify' | 'reject' | 'request_info' | 'assign'
  const [verifyNote, setVerifyNote] = useState('');
  const [verifyVisibility, setVerifyVisibility] = useState('public');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionCategory, setRejectionCategory] = useState('jurisdiction');
  const [infoMessage, setInfoMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Queue 10: Assignment State
  const [departments, setDepartments] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [assignDepartment, setAssignDepartment] = useState('');
  const [assignWorker, setAssignWorker] = useState('');
  const [assignPriority, setAssignPriority] = useState('medium');
  const [assignSlaHours, setAssignSlaHours] = useState(48);
  const [assignNote, setAssignNote] = useState('');

  // Citizen Clarification Submission State
  const [citizenResponseNote, setCitizenResponseNote] = useState('');
  const [citizenSubmitting, setCitizenSubmitting] = useState(false);
  const [citizenError, setCitizenError] = useState(null);

  const loadIssue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await issueAPI.getIssueById(id);
      if (res.data) {
        setIssue(res.data);
        setAssignPriority(res.data.priority || 'medium');
        if (res.data.department?._id || res.data.department) {
          setAssignDepartment(res.data.department?._id || res.data.department);
        }
        if (res.data.assignedWorker?._id || res.data.assignedWorker) {
          setAssignWorker(res.data.assignedWorker?._id || res.data.assignedWorker);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load civic issue details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadIssue();
  }, [loadIssue]);

  // Load departments and field workers when admin opens page
  useEffect(() => {
    const isAdminUser = user?.role === 'administrator' || user?.role === 'super_admin';
    if (!isAdminUser) return;

    async function loadAssignmentCatalogs() {
      try {
        const [deptRes, workerRes] = await Promise.all([
          configAPI.getDepartments(),
          adminAPI.getWorkers(),
        ]);
        if (deptRes.data) setDepartments(deptRes.data);
        if (workerRes.data) setWorkers(workerRes.data);
      } catch (err) {
        console.error('Failed to load assignment options', err);
      }
    }
    loadAssignmentCatalogs();
  }, [user]);

  const handleCopyTicket = () => {
    if (!issue?.issueNumber) return;
    navigator.clipboard.writeText(issue.issueNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Admin: Verify Issue
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await adminAPI.verifyIssue(issue.issueNumber || issue._id, {
        note: verifyNote,
        visibility: verifyVisibility,
      });
      if (res.data) {
        setIssue(res.data);
        setActionSuccess('Issue verified and accepted for municipal department assignment.');
        setTriageModal(null);
        setVerifyNote('');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to verify issue');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Admin: Reject Issue
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason || rejectionReason.trim().length < 10) {
      setActionError('A mandatory rejection reason of at least 10 characters is required.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await adminAPI.rejectIssue(issue.issueNumber || issue._id, {
        reason: rejectionReason,
        category: rejectionCategory,
      });
      if (res.data) {
        setIssue(res.data);
        setActionSuccess('Issue rejected with mandatory audit reason recorded.');
        setTriageModal(null);
        setRejectionReason('');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to reject issue');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Admin: Request Info
  const handleRequestInfoSubmit = async (e) => {
    e.preventDefault();
    if (!infoMessage || infoMessage.trim().length < 10) {
      setActionError('A clarification prompt of at least 10 characters is required.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await adminAPI.requestInfo(issue.issueNumber || issue._id, {
        message: infoMessage,
      });
      if (res.data) {
        setIssue(res.data);
        setActionSuccess('Clarification requested from citizen. Status transitioned to Info Requested.');
        setTriageModal(null);
        setInfoMessage('');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to request information');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Admin: Assign Issue (Queue 10)
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await adminAPI.assignIssue(issue.issueNumber || issue._id, {
        departmentId: assignDepartment || undefined,
        workerId: assignWorker || undefined,
        priority: assignPriority,
        slaHours: Number(assignSlaHours) || 48,
        assignmentNote: assignNote,
      });
      if (res.data) {
        setIssue(res.data);
        setActionSuccess('Issue assigned and dispatched to field worker with SLA deadline.');
        setTriageModal(null);
        setAssignNote('');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to assign issue');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Citizen: Provide Clarification
  const handleCitizenResponseSubmit = async (e) => {
    e.preventDefault();
    if (!citizenResponseNote || citizenResponseNote.trim().length < 5) {
      setCitizenError('Please enter a response of at least 5 characters.');
      return;
    }
    setCitizenSubmitting(true);
    setCitizenError(null);
    try {
      const res = await issueAPI.provideInfo(issue.issueNumber || issue._id, {
        responseNote: citizenResponseNote,
      });
      if (res.data) {
        setIssue(res.data);
        setActionSuccess('Thank you! Your clarification has been recorded and submitted for review.');
        setCitizenResponseNote('');
      }
    } catch (err) {
      setCitizenError(err.message || 'Failed to submit clarification');
    } finally {
      setCitizenSubmitting(false);
    }
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
  const isAdmin = user?.role === 'administrator' || user?.role === 'super_admin';
  const isReporter = user?.role === 'citizen' && (issue.reporter?._id === user?._id || issue.reporter === user?._id);
  const canAdminTriage = isAdmin && !['closed', 'rejected'].includes(issue.status);
  const canRespondInfo = (isReporter || isAdmin) && issue.status === 'info_requested';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to={isAdmin ? '/admin/review-queue' : '/my-reports'}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-teal-400 transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to {isAdmin ? 'Review Queue' : 'My Reports'}</span>
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

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between gap-3 shadow-lg shadow-emerald-500/5">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-xs text-emerald-400 hover:text-white font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

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

        {/* SLA Deadline Tracker Pill if Assigned */}
        {issue.slaDeadline && (
          <div className="pt-2 flex items-center gap-2 text-xs">
            <span className="text-slate-400">SLA Resolution Target:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-400" />
              {new Date(issue.slaDeadline).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Queue 9 & 10 Feature: Administrator Triage & Dispatch Control Center */}
      {canAdminTriage && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-sky-500/30 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Administrator Triage & Dispatch Control (Queue 9 & 10)
                </h2>
                <p className="text-xs text-slate-400">
                  Assign field workers, set SLA deadlines, verify validity, or reject with reason.
                </p>
              </div>
            </div>

            <div className="text-xs text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20 font-medium">
              Zone: {issue.serviceArea?.name || 'Kukatpally'}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {/* Queue 10: Assign Button */}
            <button
              onClick={() => {
                setTriageModal('assign');
                setActionError(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition"
            >
              <HardHat className="w-4 h-4" />
              <span>Assign Department & Worker</span>
            </button>

            {/* Queue 9: Verify Button */}
            <button
              onClick={() => {
                setTriageModal('verify');
                setActionError(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify & Accept</span>
            </button>

            {/* Queue 9: Request Info Button */}
            <button
              onClick={() => {
                setTriageModal('request_info');
                setActionError(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-600/20 transition"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Request Info</span>
            </button>

            {/* Queue 9: Reject Button */}
            <button
              onClick={() => {
                setTriageModal('reject');
                setActionError(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 hover:text-white text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Issue</span>
            </button>
          </div>
        </div>
      )}

      {/* Citizen Clarification Response Box (When info_requested) */}
      {canRespondInfo && (
        <div className="p-6 rounded-3xl bg-yellow-500/10 border border-yellow-500/30 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-yellow-500/20 text-yellow-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-yellow-200">
                Action Required: Municipal Team Requested Clarification
              </h3>
              <p className="text-xs text-yellow-300/80">
                Please provide the requested details or photos below so our field team can proceed.
              </p>
            </div>
          </div>

          <form onSubmit={handleCitizenResponseSubmit} className="space-y-3">
            <textarea
              rows={3}
              value={citizenResponseNote}
              onChange={(e) => setCitizenResponseNote(e.target.value)}
              placeholder="Type your clarification response (e.g. pole number, nearby shop name, or additional context)..."
              className="w-full bg-slate-950 border border-yellow-500/40 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
            />

            {citizenError && (
              <p className="text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {citizenError}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={citizenSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-semibold text-xs transition shadow-lg shadow-yellow-500/20 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{citizenSubmitting ? 'Submitting...' : 'Submit Clarification'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

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
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                Department & Assignment
              </h3>
              {canAdminTriage && (
                <button
                  onClick={() => setTriageModal('assign')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                >
                  <HardHat className="w-3.5 h-3.5" />
                  <span>Reassign</span>
                </button>
              )}
            </div>

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
                    {issue.assignedWorker?.name ? (
                      <span className="text-indigo-300 font-semibold">{issue.assignedWorker.name}</span>
                    ) : (
                      'Awaiting Field Dispatch'
                    )}
                  </span>
                  {issue.assignedWorker?.phone && (
                    <span className="text-[11px] text-slate-400 block">
                      📞 {issue.assignedWorker.phone}
                    </span>
                  )}
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

              {issue.reporter && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Reported By</span>
                    <span className="font-medium text-slate-200">{issue.reporter.name}</span>
                    <span className="text-[11px] text-slate-400 block">
                      {issue.reporter.phone || issue.reporter.email}
                    </span>
                  </div>
                </div>
              )}
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

      {/* Admin Queue 10: Assign Department & Worker Modal */}
      {triageModal === 'assign' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <HardHat className="w-5 h-5 text-indigo-400" />
                Dispatch & Assign Field Worker
              </h3>
              <button
                onClick={() => setTriageModal(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Responsible Municipal Department
                </label>
                <select
                  value={assignDepartment}
                  onChange={(e) => setAssignDepartment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Department...</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field Worker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assign Field Worker
                </label>
                <select
                  value={assignWorker}
                  onChange={(e) => setAssignWorker(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Field Worker...</option>
                  {workers.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.department?.name || 'Field Dept'}) — {w.activeTasksCount || 0} active tasks
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority & SLA Hours Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={assignPriority}
                    onChange={(e) => setAssignPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="urgent">🚨 Urgent (Immediate)</option>
                    <option value="high">⚠️ High Priority</option>
                    <option value="medium">⚡ Medium Priority</option>
                    <option value="low">ℹ️ Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    SLA Deadline Target (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="360"
                    value={assignSlaHours}
                    onChange={(e) => setAssignSlaHours(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Dispatch Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dispatch Instructions / Operational Note
                </label>
                <textarea
                  rows={2}
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  placeholder="e.g. Inspect road crater, deploy cold mix patch before evening rush hour."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {actionError && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {actionError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTriageModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Dispatching...' : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Verify Modal */}
      {triageModal === 'verify' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Verify & Accept Civic Report
              </h3>
              <button
                onClick={() => setTriageModal(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Verification Audit Note (Optional)
                </label>
                <textarea
                  rows={3}
                  value={verifyNote}
                  onChange={(e) => setVerifyNote(e.target.value)}
                  placeholder="e.g. Validated location on GIS. Severity confirmed. Approved for road maintenance routing."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Note Visibility
                </label>
                <select
                  value={verifyVisibility}
                  onChange={(e) => setVerifyVisibility(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="public">Public (Visible to Citizen)</option>
                  <option value="internal">Internal (Municipal Admins & Workers Only)</option>
                </select>
              </div>

              {actionError && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {actionError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTriageModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Accepting...' : 'Confirm Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Reject Modal (Queue 9: Mandatory Reason) */}
      {triageModal === 'reject' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                Reject Civic Report
              </h3>
              <button
                onClick={() => setTriageModal(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Rejection Classification
                </label>
                <select
                  value={rejectionCategory}
                  onChange={(e) => setRejectionCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
                >
                  {REJECTION_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mandatory Rejection Explanation <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain clearly to the citizen why this report cannot be resolved by the municipal corporation (min 10 chars)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
                <span className="text-[11px] text-slate-400">
                  This explanation is permanently logged in the public audit timeline.
                </span>
              </div>

              {actionError && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {actionError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTriageModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Request Info Modal */}
      {triageModal === 'request_info' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-yellow-500/30 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-yellow-400" />
                Request Information from Citizen
              </h3>
              <button
                onClick={() => setTriageModal(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestInfoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Clarification Prompt <span className="text-yellow-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={infoMessage}
                  onChange={(e) => setInfoMessage(e.target.value)}
                  placeholder="Specify what details are missing (e.g. Landmark is ambiguous, please clarify building name or pole ID)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-yellow-500"
                />
              </div>

              {actionError && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {actionError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTriageModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-semibold shadow-lg shadow-yellow-600/20 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
