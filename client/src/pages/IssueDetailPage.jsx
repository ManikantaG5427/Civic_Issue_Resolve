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
  Wrench,
  Play,
  Upload,
  Layers,
  Star,
  RotateCcw,
  Compass,
  Users,
  UserPlus,
  UserMinus,
  Camera,
} from 'lucide-react';
import { extractExifGpsData } from '../utils/exifReader';
import { issueAPI, adminAPI, configAPI, workerAPI, uploadAPI, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Timeline from '../components/Timeline';
import MapPreview from '../components/MapPreview';
import BeforeAfterComparison from '../components/BeforeAfterComparison';
import CommentSection from '../components/CommentSection';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';

const REJECTION_CATEGORIES = [
  { value: 'jurisdiction', label: 'Out of Municipal Jurisdiction' },
  { value: 'duplicate', label: 'Duplicate Civic Report' },
  { value: 'insufficient_evidence', label: 'Insufficient Evidence / Unlocatable' },
  { value: 'private_property', label: 'Private Property / Non-Civic Matter' },
  { value: 'inappropriate', label: 'Inappropriate Content or Spam' },
  { value: 'other', label: 'Other Operational Constraint' },
];

export default function IssueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinIssue, leaveIssue, subscribeToEvent } = useSocket();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Admin Triage Modal States
  const [triageModal, setTriageModal] = useState(null); // 'verify' | 'reject' | 'request_info' | 'assign'
  const [verifyNote, setVerifyNote] = useState('');
  const [verifyVisibility, setVerifyVisibility] = useState('public');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionCategory, setRejectionCategory] = useState('jurisdiction');
  const [infoMessage, setInfoMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Assignment State
  const [departments, setDepartments] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [assignDepartment, setAssignDepartment] = useState('');
  const [assignWorker, setAssignWorker] = useState('');
  const [assignPriority, setAssignPriority] = useState('medium');
  const [assignSlaHours, setAssignSlaHours] = useState(48);
  const [assignNote, setAssignNote] = useState('');

  // Worker Actions State
  const [workerModal, setWorkerModal] = useState(null); // 'start_work' | 'progress_update' | 'resolve'
  const [startWorkNote, setStartWorkNote] = useState('');
  const [progressNote, setProgressNote] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState('');
  const [isInternalProgress, setIsInternalProgress] = useState(false);
  const [progressPhotos, setProgressPhotos] = useState([]);
  const [uploadingProgressPhotos, setUploadingProgressPhotos] = useState(false);

  // Resolution Proof State
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [resolutionPhotos, setResolutionPhotos] = useState([]);
  const [uploadingResolutionPhotos, setUploadingResolutionPhotos] = useState(false);
  const [repairCost, setRepairCost] = useState('');
  const [materialsUsedResolution, setMaterialsUsedResolution] = useState('');

  // Citizen Verification & Reopen State
  const [citizenModal, setCitizenModal] = useState(null); // 'rating' | 'reopen'
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [reopenReasonText, setReopenReasonText] = useState('');
  const [reopenPhotos, setReopenPhotos] = useState([]);
  const [uploadingReopenPhotos, setUploadingReopenPhotos] = useState(false);

  // Citizen Clarification Submission State
  const [citizenResponseNote, setCitizenResponseNote] = useState('');
  const [citizenSubmitting, setCitizenSubmitting] = useState(false);
  const [citizenError, setCitizenError] = useState(null);

  // 3-Phase Work Execution Proof State
  const [phaseModal, setPhaseModal] = useState(null); // 'starting' | 'during' | 'completion'
  const [phaseNote, setPhaseNote] = useState('');
  const [phaseImages, setPhaseImages] = useState([]);
  const [uploadingPhaseImages, setUploadingPhaseImages] = useState(false);
  const [phaseGpsVerified, setPhaseGpsVerified] = useState(null);

  // Multi-Worker Dispatch Management State
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [newWorkerId, setNewWorkerId] = useState('');
  const [newWorkerRole, setNewWorkerRole] = useState('Field Specialist');
  const [newWorkerNote, setNewWorkerNote] = useState('');

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

  // Real-time Socket.IO room subscription for live issue synchronization
  useEffect(() => {
    if (!id) return;
    joinIssue(id);

    const unsubscribe = subscribeToEvent('issue_updated', (updatedData) => {
      if (
        updatedData &&
        (updatedData._id === id || updatedData.issueNumber === id || updatedData._id?.toString() === id)
      ) {
        setIssue(updatedData);
      }
    });

    return () => {
      leaveIssue(id);
      if (unsubscribe) unsubscribe();
    };
  }, [id, joinIssue, leaveIssue, subscribeToEvent]);

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

  // Upvote & Follow Actions
  const handleToggleUpvote = async () => {
    try {
      const res = await issueAPI.toggleUpvote(issue.issueNumber || issue._id);
      if (res.data) {
        setIssue((prev) => ({
          ...prev,
          upvotes: res.data.hasUpvoted
            ? [...(prev.upvotes || []), user?._id]
            : (prev.upvotes || []).filter((u) => (u._id || u).toString() !== user?._id?.toString()),
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFollow = async () => {
    try {
      const res = await issueAPI.toggleFollow(issue.issueNumber || issue._id);
      if (res.data) {
        setIssue((prev) => ({
          ...prev,
          followers: res.data.hasFollowed
            ? [...(prev.followers || []), user?._id]
            : (prev.followers || []).filter((f) => (f._id || f).toString() !== user?._id?.toString()),
        }));
      }
    } catch (err) {
      console.error(err);
    }
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
      setActionError('Please provide a descriptive rejection explanation (at least 10 characters).');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await adminAPI.rejectIssue(issue.issueNumber || issue._id, {
        reason: rejectionReason.trim(),
        category: rejectionCategory,
      });
      if (res.data) {
        setIssue(res.data);
        setActionSuccess('Issue marked as rejected. Public timeline has been updated with reasoning.');
        setTriageModal(null);
        setRejectionReason('');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to reject issue');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Admin: Request Clarification
  const handleRequestInfoSubmit = async (e) => {
    e.preventDefault();
    if (!infoMessage || infoMessage.trim().length < 5) {
      setActionError('Clarification prompt must be at least 5 characters.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await adminAPI.requestMoreInfo(issue.issueNumber || issue._id, {
        message: infoMessage.trim(),
      });
      if (res.data) {
        setIssue(res.data);
        setActionSuccess('Clarification request sent to the citizen.');
        setTriageModal(null);
        setInfoMessage('');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to request clarification');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Admin: Assign Issue to Department & Worker
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignDepartment) {
      setActionError('Please select a responsible municipal department.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await adminAPI.assignIssue(issue.issueNumber || issue._id, {
        departmentId: assignDepartment,
        workerId: assignWorker || undefined,
        priority: assignPriority,
        slaHours: Number(assignSlaHours) || 48,
        note: assignNote,
      });
      if (res.data) {
        setIssue(res.data);
        setActionSuccess('Issue assigned and SLA dispatched successfully.');
        setTriageModal(null);
        setAssignNote('');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to assign issue');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Worker: Start Work on Site
  const handleStartWorkSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await workerAPI.startWork(issue.issueNumber || issue._id, {
        note: startWorkNote,
      });
      if (res.data) {
        setIssue(res.data);
        setActionSuccess('Work marked as In Progress. Time tracking active.');
        setWorkerModal(null);
        setStartWorkNote('');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to update work status');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Worker: Progress Photo Upload
  const handleProgressPhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    setUploadingProgressPhotos(true);
    try {
      const uploadPromises = files.map((file) => uploadAPI.uploadImage(file));
      const results = await Promise.all(uploadPromises);
      const urls = results.map((r) => r.data?.url).filter(Boolean);
      setProgressPhotos((prev) => [...prev, ...urls]);
    } catch {
      setActionError('Failed to upload some progress photos. Please try again.');
    } finally {
      setUploadingProgressPhotos(false);
    }
  };

  // 7. Worker: Add Progress Update
  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    if (!progressNote || progressNote.trim().length < 5) {
      setActionError('Please provide a descriptive progress note (at least 5 characters).');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await workerAPI.addProgressUpdate(issue.issueNumber || issue._id, {
        note: progressNote.trim(),
        materialsUsed: materialsUsed.trim() || undefined,
        isInternal: isInternalProgress,
        photos: progressPhotos,
      });
      if (res.data) {
        setIssue(res.data);
        setActionSuccess('Progress update logged to municipal record.');
        setWorkerModal(null);
        setProgressNote('');
        setMaterialsUsed('');
        setProgressPhotos([]);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to log progress update');
    } finally {
      setActionLoading(false);
    }
  };

  // 8. Worker: Resolution Photo Upload
  const handleResolutionPhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    setUploadingResolutionPhotos(true);
    try {
      const uploadPromises = files.map((file) => uploadAPI.uploadImage(file));
      const results = await Promise.all(uploadPromises);
      const urls = results.map((r) => r.data?.url).filter(Boolean);
      setResolutionPhotos((prev) => [...prev, ...urls]);
    } catch {
      setActionError('Failed to upload resolution proof photos. Please try again.');
    } finally {
      setUploadingResolutionPhotos(false);
    }
  };

  // 9. Worker: Submit Resolution Proof
  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionSummary || resolutionSummary.trim().length < 5) {
      setActionError('Please provide a resolution summary describing the fix.');
      return;
    }
    if (!resolutionPhotos || resolutionPhotos.length === 0) {
      setActionError('Mandatory resolution proof photos must be attached.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await workerAPI.submitResolution(issue.issueNumber || issue._id, {
        summary: resolutionSummary.trim(),
        photos: resolutionPhotos,
        materialsUsed: materialsUsedResolution.trim() || undefined,
        cost: repairCost ? Number(repairCost) : undefined,
      });
      if (res.data) {
        setIssue(res.data);
        setActionSuccess('Resolution proof submitted. Awaiting citizen confirmation.');
        setWorkerModal(null);
        setResolutionSummary('');
        setResolutionPhotos([]);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to submit resolution proof');
    } finally {
      setActionLoading(false);
    }
  };

  // 10. Citizen: Confirm Resolution & Rate Service
  const handleConfirmResolutionSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await issueAPI.confirmResolution(issue.issueNumber || issue._id, {
        rating: ratingValue,
        comment: ratingFeedback.trim() || undefined,
      });
      if (res.data) {
        setIssue(res.data);
        setActionSuccess('Resolution confirmed! Thank you for helping improve our community.');
        setCitizenModal(null);
        setRatingFeedback('');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to confirm resolution');
    } finally {
      setActionLoading(false);
    }
  };

  // 11. Citizen: Reopen Photo Upload
  const handleReopenPhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    setUploadingReopenPhotos(true);
    try {
      const uploadPromises = files.map((file) => uploadAPI.uploadImage(file));
      const results = await Promise.all(uploadPromises);
      const urls = results.map((r) => r.data?.url).filter(Boolean);
      setReopenPhotos((prev) => [...prev, ...urls]);
    } catch {
      setActionError('Failed to upload reopen photos.');
    } finally {
      setUploadingReopenPhotos(false);
    }
  };

  // 12. Citizen: Reopen Issue
  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (!reopenReasonText || reopenReasonText.trim().length < 10) {
      setActionError('Please provide a detailed reason for reopening (min 10 characters).');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await issueAPI.reopenIssue(issue.issueNumber || issue._id, {
        reason: reopenReasonText.trim(),
        photos: reopenPhotos,
      });
      if (res.data) {
        setIssue(res.data);
        setActionSuccess('Issue reopened for municipal review and re-dispatch.');
        setCitizenModal(null);
        setReopenReasonText('');
        setReopenPhotos([]);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to reopen issue');
    } finally {
      setActionLoading(false);
    }
  };

  // 13. Citizen: Provide Requested Clarification Info
  const handleCitizenResponseSubmit = async (e) => {
    e.preventDefault();
    if (!citizenResponseNote || citizenResponseNote.trim().length < 5) {
      setCitizenError('Clarification note must be at least 5 characters.');
      return;
    }
    setCitizenSubmitting(true);
    setCitizenError(null);
    try {
      const res = await issueAPI.addComment(issue.issueNumber || issue._id, {
        content: `[Citizen Clarification Response]: ${citizenResponseNote.trim()}`,
        isInternal: false,
      });
      if (res.data) {
        setIssue((prev) => ({
          ...prev,
          comments: res.data.comments || [...(prev.comments || []), res.data],
        }));
        setCitizenResponseNote('');
        setActionSuccess('Clarification response submitted successfully.');
      }
    } catch (err) {
      setCitizenError(err.message || 'Failed to submit clarification response');
    } finally {
      setCitizenSubmitting(false);
    }
  };

  // 14. Multi-Worker Management Handlers
  const handleAddWorkerSubmit = async (e) => {
    e.preventDefault();
    if (!newWorkerId) {
      setActionError('Please select a field worker from the list.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await adminAPI.addWorkerToRoster(issue.issueNumber || issue._id, {
        workerId: newWorkerId,
        role: newWorkerRole,
        note: newWorkerNote,
      });
      if (res.data) {
        setIssue(res.data);
        setActionSuccess('Worker assigned to dispatch roster successfully.');
        setShowAddWorkerModal(false);
        setNewWorkerId('');
        setNewWorkerNote('');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to add worker');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveWorkerSubmit = async (workerId) => {
    if (!window.confirm('Are you sure you want to remove this worker from the team roster?')) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await adminAPI.removeWorkerFromRoster(issue.issueNumber || issue._id, workerId);
      if (res.data) {
        setIssue(res.data);
        setActionSuccess('Worker removed from team roster.');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to remove worker');
    } finally {
      setActionLoading(false);
    }
  };

  // 15. 3-Phase Work Execution Proof Upload Handler
  const handlePhaseImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingPhaseImages(true);
    setActionError(null);
    try {
      const uploadedList = [];
      for (const file of files) {
        const exif = await extractExifGpsData(file);
        if (exif.hasGeoTag) {
          setPhaseGpsVerified(exif);
        }
        const res = await uploadAPI.uploadImage(file, 'progress');
        const imgData = res.data;
        if (imgData?.url) {
          uploadedList.push({
            url: imgData.url,
            filename: file.name,
            geoTag: exif.hasGeoTag ? exif : null,
          });
        }
      }
      setPhaseImages((prev) => [...prev, ...uploadedList]);
    } catch (err) {
      console.error('[Phase Image Upload Error]', err);
      setActionError(err.message || 'Failed to upload phase photos. Please try again.');
    } finally {
      setUploadingPhaseImages(false);
    }
  };

  const handlePhaseProofSubmit = async (e) => {
    e.preventDefault();
    if (phaseImages.length === 0) {
      setActionError('At least one verified geo-tagged photograph is required for this phase.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await adminAPI.submitPhaseProof(issue.issueNumber || issue._id, {
        phase: phaseModal,
        images: phaseImages,
        note: phaseNote,
        geoTag: phaseGpsVerified || {
          latitude: lat,
          longitude: lng,
          isCameraGpsVerified: true,
        },
      });
      if (res.data) {
        setIssue(res.data);
        setActionSuccess(`Phase proof for ${phaseModal.toUpperCase()} recorded successfully.`);
        setPhaseModal(null);
        setPhaseNote('');
        setPhaseImages([]);
        setPhaseGpsVerified(null);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to submit phase proof');
    } finally {
      setActionLoading(false);
    }
  };

  // 14. Citizen: Withdraw / Cancel Issue
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await issueAPI.withdrawIssue(issue.issueNumber || issue._id, {
        reason: withdrawalReason.trim(),
      });
      if (res.data) {
        setIssue(res.data);
        setActionSuccess('Your civic report has been withdrawn.');
        setShowWithdrawModal(false);
        setWithdrawalReason('');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to withdraw issue');
    } finally {
      setActionLoading(false);
    }
  };

  // 15. Citizen / Admin: Delete Unassigned Report Permanently
  const handleDeleteSubmit = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await issueAPI.deleteIssue(issue.issueNumber || issue._id);
      navigate('/my-reports');
    } catch (err) {
      setActionError(err.message || 'Failed to delete issue');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse py-4">
        <div className="h-8 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="h-32 bg-white rounded-2xl border border-slate-200 shadow-soft"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="h-48 bg-white rounded-2xl border border-slate-200 shadow-soft"></div>
            <div className="h-64 bg-white rounded-2xl border border-slate-200 shadow-soft"></div>
          </div>
          <div className="h-96 bg-white rounded-2xl border border-slate-200 shadow-soft"></div>
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 font-heading">Issue Ticket Not Found</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {error || `We couldn't locate a civic issue with ticket identifier "${id}". Please check the ticket number and try again.`}
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition"
          >
            Go to Home
          </button>
          <Link
            to="/map"
            className="px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold transition shadow-sm"
          >
            Explore Public Map
          </Link>
        </div>
      </div>
    );
  }

  const rawCoords =
    Array.isArray(issue?.location?.coordinates) && issue.location.coordinates.length === 2
      ? issue.location.coordinates
      : [78.3967, 17.4849];
  const lng = typeof rawCoords[0] === 'number' && Number.isFinite(rawCoords[0]) ? rawCoords[0] : (parseFloat(rawCoords[0]) || 78.3967);
  const lat = typeof rawCoords[1] === 'number' && Number.isFinite(rawCoords[1]) ? rawCoords[1] : (parseFloat(rawCoords[1]) || 17.4849);

  const categoryName =
    typeof issue.category === 'object' && issue.category !== null
      ? issue.category.name || 'Civic Issue'
      : typeof issue.category === 'string'
      ? issue.category
      : 'Civic Issue';

  const userId = user?._id ? user._id.toString() : null;
  const reporterId = issue?.reporter?._id
    ? issue.reporter._id.toString()
    : (typeof issue?.reporter === 'string' ? issue.reporter : null);
  const isReporter = !!(userId && reporterId && userId === reporterId);

  const workerId = issue?.assignedWorker?._id
    ? issue.assignedWorker._id.toString()
    : (typeof issue?.assignedWorker === 'string' ? issue.assignedWorker : null);
  const isAssignedWorker = !!(userId && workerId && userId === workerId && user?.role === 'field_worker');

  const isAdmin = user?.role === 'administrator' || user?.role === 'super_admin';
  const canWorkerOperate =
    (isAssignedWorker || user?.role === 'super_admin') &&
    ['assigned', 'in_progress', 'reopened'].includes(issue.status);
  const canAdminTriage = isAdmin && !['closed', 'rejected'].includes(issue.status);
  const canRespondInfo = (isReporter || isAdmin) && issue.status === 'info_requested';

  const hasUpvoted = !!(userId && Array.isArray(issue.upvotes) && issue.upvotes.some((u) => u && ((u._id ? u._id.toString() : u.toString()) === userId)));
  const hasFollowed = !!(userId && Array.isArray(issue.followers) && issue.followers.some((f) => f && ((f._id ? f._id.toString() : f.toString()) === userId)));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand-700 transition group font-medium"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Upvote Civic Support Button */}
          {user && (
            <button
              onClick={handleToggleUpvote}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                hasUpvoted
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-sm'
              }`}
              title="Upvote to elevate municipal priority"
            >
              <span>👍 Upvote</span>
              <span className="font-bold">{issue.upvotes?.length || 0}</span>
            </button>
          )}

          {/* Follow Updates Button */}
          {user && (
            <button
              onClick={handleToggleFollow}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                hasFollowed
                  ? 'bg-brand-50 text-brand-800 border-brand-300'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-sm'
              }`}
              title="Follow issue for live notification updates"
            >
              <span>🔔</span>
              <span>{hasFollowed ? 'Following' : 'Follow'}</span>
            </button>
          )}

          {/* Citizen Withdraw Option */}
          {(isReporter || isAdmin) && !['closed', 'rejected', 'withdrawn'].includes(issue.status) && (
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-700 hover:text-red-800 border border-red-200 text-xs font-semibold transition shadow-sm"
              title="Withdraw your reported issue"
            >
              <span>Withdraw Report</span>
            </button>
          )}

          {/* Delete Option for Untriaged / Withdrawn issues */}
          {(isReporter || user?.role === 'super_admin') && ['submitted', 'withdrawn'].includes(issue.status) && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 text-xs font-semibold transition shadow-sm"
              title="Permanently remove this report"
            >
              <span>Delete</span>
            </button>
          )}

          <button
            onClick={handleCopyTicket}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-mono text-slate-700 transition shadow-sm"
            title="Copy Ticket ID"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-brand-700" />
                <span className="text-brand-700 font-semibold">Copied!</span>
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
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-xs text-green-700 hover:text-green-900 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-soft space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
              {issue.issueNumber}
            </span>
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority || 'medium'} />
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Reported on{' '}
              {new Date(issue.createdAt).toLocaleString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-heading">
            {issue.title}
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
            {categoryName} complaint located in{' '}
            <strong className="text-slate-800 font-semibold">
              {issue.location?.address || issue.serviceArea?.name || 'Municipal Area, India'}
            </strong>.
          </p>
        </div>

        {/* SLA Deadline Tracker Pill */}
        {issue.slaDeadline && (
          <div className="pt-2 flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">SLA Resolution Target:</span>
            <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-700" />
              {new Date(issue.slaDeadline).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Field Worker Operations & Progress Center */}
      {canWorkerOperate && (
        <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-200 shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-300">
                <HardHat className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-amber-950 font-heading">
                  Field Worker Operations & Live Execution
                </h2>
                <p className="text-xs text-amber-800">
                  Update on-site repair progress, log equipment/materials used, or begin execution.
                </p>
              </div>
            </div>

            <div className="text-xs text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 font-semibold">
              Assigned: {user?.name || 'Field Specialist'}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {issue.status === 'assigned' && (
              <button
                onClick={() => {
                  setWorkerModal('start_work');
                  setActionError(null);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Work on Site</span>
              </button>
            )}

            <button
              onClick={() => {
                setWorkerModal('progress_update');
                setActionError(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-300 shadow-sm transition"
            >
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>Log Progress & Materials</span>
            </button>

            <button
              onClick={() => {
                setWorkerModal('resolve');
                setActionError(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-semibold shadow-sm transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit Resolution Proof</span>
            </button>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-sm transition"
            >
              <MapPin className="w-3.5 h-3.5 text-brand-700" />
              <span>Navigate in Google Maps</span>
            </a>
          </div>
        </div>
      )}

      {/* Administrator Triage & Dispatch Control Center */}
      {canAdminTriage && (
        <div className="p-6 rounded-2xl bg-brand-50/50 border border-brand-200 shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-200">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-100 text-brand-800 border border-brand-200">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 font-heading">
                  Administrator Triage & Dispatch Control
                </h2>
                <p className="text-xs text-slate-600">
                  Assign field workers, set SLA deadlines, verify validity, or reject with reason.
                </p>
              </div>
            </div>

            <div className="text-xs text-brand-800 bg-brand-100 px-3 py-1 rounded-full border border-brand-200 font-semibold">
              Zone: {issue.serviceArea?.name || 'Municipal Area'}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => {
                setTriageModal('assign');
                setActionError(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold shadow-sm transition"
            >
              <HardHat className="w-4 h-4" />
              <span>Assign Department & Worker</span>
            </button>

            <button
              onClick={() => {
                setTriageModal('verify');
                setActionError(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-semibold shadow-sm transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify & Accept</span>
            </button>

            <button
              onClick={() => {
                setTriageModal('request_info');
                setActionError(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Request Info</span>
            </button>

            <button
              onClick={() => {
                setTriageModal('reject');
                setActionError(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Issue</span>
            </button>
          </div>
        </div>
      )}

      {/* Citizen Clarification Response Box */}
      {canRespondInfo && (
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 shadow-soft space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-950 font-heading">
                Action Required: Municipal Team Requested Clarification
              </h3>
              <p className="text-xs text-amber-800">
                Please provide the requested details or photos below so our field team can proceed.
              </p>
            </div>
          </div>

          <form onSubmit={handleCitizenResponseSubmit} className="space-y-3">
            <textarea
              rows={3}
              value={citizenResponseNote}
              onChange={(e) => setCitizenResponseNote(e.target.value)}
              placeholder="Type your clarification response (e.g. pole number, nearby landmark, or additional context)..."
              className="w-full bg-white border border-amber-300 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
            />

            {citizenError && (
              <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {citizenError}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={citizenSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-semibold text-xs transition shadow-sm disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{citizenSubmitting ? 'Submitting...' : 'Submit Clarification'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Citizen Resolution Verification & Closure Banner */}
      {issue.status === 'resolved_verification_pending' && (isReporter || isAdmin) && (
        <div className="p-6 rounded-2xl bg-green-50 border border-green-200 shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-green-100 text-green-800 border border-green-300 shadow-sm">
                <CheckCircle2 className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-green-950 flex items-center gap-2 font-heading">
                  Action Required: Verify Municipal Field Repair
                </h3>
                <p className="text-xs text-green-800">
                  The municipal field worker has submitted photographic proof of completion. Please review the before/after photos below and confirm closure.
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-800 border border-green-300">
              Pending Your Confirmation
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => {
                setCitizenModal('rating');
                setActionError(null);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold text-xs shadow-sm transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Resolution & Rate Service</span>
            </button>

            <button
              onClick={() => {
                setCitizenModal('reopen');
                setActionError(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-red-50 text-red-700 font-semibold text-xs border border-red-300 shadow-sm transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reopen Ticket (Work Incomplete)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Details + Resolution Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Issue Description, Evidence, Location */}
        <div className="lg:col-span-2 space-y-6">
          {/* Citizen Feedback & Review Stars Card */}
          {issue.feedback?.rating && (
            <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-50/40 via-white to-white border border-amber-200/80 shadow-soft space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-800 flex items-center justify-center border border-amber-200 shadow-sm">
                    <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                      <span>Citizen Work Completion Review</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified Rating
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Public satisfaction feedback submitted by the complainant
                    </p>
                  </div>
                </div>

                {/* 5-Star Visualizer & Quality Label */}
                <div className="flex flex-col sm:items-end gap-1">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-5 h-5 transition-transform duration-200 ${
                          s <= issue.feedback.rating
                            ? 'text-amber-500 fill-amber-500 drop-shadow-sm'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-sm font-extrabold text-slate-900 ml-2 font-mono">
                      {issue.feedback.rating}.0<span className="text-slate-400 font-normal text-xs">/5.0</span>
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-amber-800">
                    {issue.feedback.rating === 5
                      ? 'Outstanding Resolution Quality'
                      : issue.feedback.rating === 4
                      ? 'Very Good Execution'
                      : issue.feedback.rating === 3
                      ? 'Satisfactory Resolution'
                      : issue.feedback.rating === 2
                      ? 'Needs Improvement'
                      : 'Unsatisfactory Work'}
                  </span>
                </div>
              </div>

              {issue.feedback.comment && (
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs relative">
                  <span className="text-2xl text-slate-300 absolute top-2 left-3 font-serif">“</span>
                  <p className="text-xs text-slate-700 italic pl-5 pr-2 leading-relaxed">
                    {issue.feedback.comment}
                  </p>
                </div>
              )}

              {issue.feedback.submittedAt && (
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Reviewed on {new Date(issue.feedback.submittedAt).toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Civic Service Closed & Verified
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Detailed Description */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-soft">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-heading">
              <FileText className="w-4 h-4 text-brand-700" />
              Issue Description
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-200">
              {issue.description}
            </p>
          </div>

          {/* Evidence Photos & Before/After Proof Gallery */}
          <BeforeAfterComparison
            evidence={issue.evidence || []}
            onExpandPhoto={(url) => setSelectedPhoto(url)}
          />

          {/* 3-Phase Work Execution Proof (Starting Phase, During Phase, Completion Phase) */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-50 text-brand-700 border border-brand-200">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-heading">
                    3-Phase Work Execution Proof
                  </h2>
                  <p className="text-xs text-slate-500">
                    Mandatory verifiable progress stages: Site Arrival ➔ Work in Progress ➔ Completion with GeoTags.
                  </p>
                </div>
              </div>

              {(canAdminTriage || canWorkerOperate) && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPhaseModal('starting');
                      setActionError(null);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition"
                  >
                    + Phase 1 (Start)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhaseModal('during');
                      setActionError(null);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 transition"
                  >
                    + Phase 2 (During)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhaseModal('completion');
                      setActionError(null);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition"
                  >
                    + Phase 3 (Complete)
                  </button>
                </div>
              )}
            </div>

            {/* 3-Phase Stepper / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Phase 1: Starting */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    Phase 1: Starting
                  </span>
                  {issue.executionPhases?.startingPhase?.startedAt && (
                    <span className="text-[10px] text-slate-500">
                      {new Date(issue.executionPhases.startingPhase.startedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {issue.executionPhases?.startingPhase?.images?.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {issue.executionPhases.startingPhase.images.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedPhoto(getImageUrl(img.url))}
                          className="aspect-square rounded-lg overflow-hidden bg-slate-200 border border-slate-300 cursor-pointer group relative"
                        >
                          <img
                            src={getImageUrl(img.url)}
                            alt="Starting Proof"
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                          <div className="absolute top-1 left-1 bg-blue-600 text-white text-[8px] font-bold px-1 rounded">
                            GPS
                          </div>
                        </div>
                      ))}
                    </div>
                    {issue.executionPhases.startingPhase.note && (
                      <p className="text-xs text-slate-600 italic">
                        "{issue.executionPhases.startingPhase.note}"
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                    Awaiting Site Arrival Proof
                  </div>
                )}
              </div>

              {/* Phase 2: During */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Phase 2: In Progress
                  </span>
                  {issue.executionPhases?.duringPhase?.inProgressAt && (
                    <span className="text-[10px] text-slate-500">
                      {new Date(issue.executionPhases.duringPhase.inProgressAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {issue.executionPhases?.duringPhase?.images?.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {issue.executionPhases.duringPhase.images.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedPhoto(getImageUrl(img.url))}
                          className="aspect-square rounded-lg overflow-hidden bg-slate-200 border border-slate-300 cursor-pointer group relative"
                        >
                          <img
                            src={getImageUrl(img.url)}
                            alt="During Proof"
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                          <div className="absolute top-1 left-1 bg-amber-600 text-white text-[8px] font-bold px-1 rounded">
                            GPS
                          </div>
                        </div>
                      ))}
                    </div>
                    {issue.executionPhases.duringPhase.note && (
                      <p className="text-xs text-slate-600 italic">
                        "{issue.executionPhases.duringPhase.note}"
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                    Awaiting In-Progress Proof
                  </div>
                )}
              </div>

              {/* Phase 3: Completion */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Phase 3: Completed
                  </span>
                  {issue.executionPhases?.completionPhase?.completedAt && (
                    <span className="text-[10px] text-slate-500">
                      {new Date(issue.executionPhases.completionPhase.completedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {issue.executionPhases?.completionPhase?.images?.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {issue.executionPhases.completionPhase.images.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedPhoto(getImageUrl(img.url))}
                          className="aspect-square rounded-lg overflow-hidden bg-slate-200 border border-slate-300 cursor-pointer group relative"
                        >
                          <img
                            src={getImageUrl(img.url)}
                            alt="Completion Proof"
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                          <div className="absolute top-1 left-1 bg-emerald-600 text-white text-[8px] font-bold px-1 rounded">
                            GPS
                          </div>
                        </div>
                      ))}
                    </div>
                    {issue.executionPhases.completionPhase.note && (
                      <p className="text-xs text-slate-600 italic">
                        "{issue.executionPhases.completionPhase.note}"
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                    Awaiting Final Completion Proof
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Complete Location, Landmark & Geotag Details */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-heading">
                <MapPin className="w-4 h-4 text-brand-700" />
                Location & Indian Municipal Jurisdiction
              </h2>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-700 hover:text-brand-800 font-semibold flex items-center gap-1"
              >
                <span>View on Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="sm:col-span-2">
                <span className="text-slate-500 block text-[11px] font-semibold uppercase tracking-wider mb-0.5">
                  Complete Street / Area Address
                </span>
                <span className="font-medium text-slate-900">
                  {issue.location?.address || issue.serviceArea?.name || 'India'}
                </span>
              </div>

              {issue.location?.landmark && (
                <div>
                  <span className="text-slate-500 block text-[11px] font-semibold uppercase tracking-wider mb-0.5">
                    Prominent Landmark
                  </span>
                  <span className="font-semibold text-brand-700">
                    🏛️ {issue.location.landmark}
                  </span>
                </div>
              )}

              <div>
                <span className="text-slate-500 block text-[11px] font-semibold uppercase tracking-wider mb-0.5">
                  Service Jurisdiction / District
                </span>
                <span className="font-semibold text-slate-900">
                  {issue.serviceArea?.name || 'Municipal Corporation Zone'}
                  {issue.serviceArea?.state ? `, ${issue.serviceArea.state}` : ''}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px] font-semibold uppercase tracking-wider mb-0.5">
                  GPS Coordinates
                </span>
                <span className="font-mono text-xs text-slate-700 font-bold">
                  {typeof lat === 'number' && !isNaN(lat) ? lat.toFixed(6) : '0.000000'}° N,{' '}
                  {typeof lng === 'number' && !isNaN(lng) ? lng.toFixed(6) : '0.000000'}° E
                </span>
              </div>
            </div>

            <div className="pt-1">
              <MapPreview latitude={lat} longitude={lng} height="240px" zoom={16} />
            </div>
          </div>

          {/* Discussions & Community Comments */}
          <CommentSection
            issueId={issue.issueNumber || issue._id}
            initialComments={issue.comments || []}
            onCommentAdded={(data) => {
              if (data?.comments) {
                setIssue((prev) => ({ ...prev, comments: data.comments }));
              }
            }}
          />
        </div>

        {/* Right Column: Municipal Assignment & Vertical Timeline */}
        <div className="space-y-6">
          {/* Assignment & Department Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider font-heading">
                Department & Assignment
              </h3>
              {canAdminTriage && (
                <button
                  onClick={() => setTriageModal('assign')}
                  className="text-xs text-brand-700 hover:text-brand-800 font-semibold flex items-center gap-1"
                >
                  <HardHat className="w-3.5 h-3.5" />
                  <span>Reassign</span>
                </button>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Responsible Department</span>
                  <span className="font-semibold text-slate-900">
                    {issue.department?.name || 'Awaiting Department Routing'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <HardHat className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Field Worker</span>
                  <span className="font-semibold text-slate-900">
                    {issue.assignedWorker?.name ? (
                      <span className="text-brand-700 font-bold">{issue.assignedWorker.name}</span>
                    ) : (
                      'Awaiting Field Dispatch'
                    )}
                  </span>
                  {issue.assignedWorker?.phone && (
                    <span className="text-[11px] text-slate-600 block font-medium">
                      📞 {issue.assignedWorker.phone}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-800 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Service Jurisdiction</span>
                  <span className="font-semibold text-slate-900">
                    {issue.serviceArea?.name || 'General Municipal Zone'}{issue.serviceArea?.code ? ` (${issue.serviceArea.code})` : ''}
                  </span>
                </div>
              </div>

              {issue.reporter && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">Reported By</span>
                    <span className="font-semibold text-slate-900">{issue.reporter.name || 'Citizen'}</span>
                    {issue.reporter.phone && (
                      <span className="text-[11px] text-slate-500 block">
                        {issue.reporter.phone}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dispatched Multi-Worker Team Roster Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-700" />
                <h3 className="text-xs uppercase font-bold text-slate-700 tracking-wider font-heading">
                  Field Response Team ({issue.assignedWorkers?.length || 0})
                </h3>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAddWorkerModal(true);
                    setActionError(null);
                  }}
                  className="text-xs text-brand-700 hover:text-brand-800 font-bold flex items-center gap-1 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg border border-brand-200 transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Add Worker</span>
                </button>
              )}
            </div>

            {issue.assignedWorkers && issue.assignedWorkers.length > 0 ? (
              <div className="space-y-2.5">
                {issue.assignedWorkers.map((item, idx) => {
                  const workerObj = item.worker || {};
                  return (
                    <div
                      key={item._id || idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 truncate">
                            {workerObj.name || 'Field Specialist'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-semibold">
                            {item.role || 'Field Worker'}
                          </span>
                        </div>
                        {workerObj.phone && (
                          <span className="text-[11px] text-slate-500 block">📞 {workerObj.phone}</span>
                        )}
                        {item.note && (
                          <p className="text-[11px] text-slate-600 italic">"{item.note}"</p>
                        )}
                        {item.assignedAt && (
                          <span className="text-[10px] text-slate-400 block">
                            Assigned: {new Date(item.assignedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleRemoveWorkerSubmit(workerObj._id || item.worker)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition"
                          title="Remove worker from roster"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No additional field crew assigned yet.
              </div>
            )}
          </div>

          {/* Resolution Timeline */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-heading">
                <Clock className="w-4 h-4 text-brand-700" />
                Resolution Timeline
              </h3>
              <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                Audit Trail
              </span>
            </div>

            <Timeline items={issue.timeline || []} />
          </div>
        </div>
      </div>

      {/* Admin Modal: Assign Department & Worker */}
      {triageModal === 'assign' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-heading">
                <HardHat className="w-5 h-5 text-brand-700" />
                Dispatch & Assign Field Worker
              </h3>
              <button
                onClick={() => setTriageModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Responsible Municipal Department
                </label>
                <select
                  value={assignDepartment}
                  onChange={(e) => setAssignDepartment(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                >
                  <option value="">Select Department...</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Field Worker
                </label>
                <select
                  value={assignWorker}
                  onChange={(e) => setAssignWorker(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                >
                  <option value="">Select Field Worker...</option>
                  {workers.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.department?.name || 'Field Dept'}) — {w.activeTasksCount || 0} active tasks
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={assignPriority}
                    onChange={(e) => setAssignPriority(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                  >
                    <option value="urgent">🚨 Urgent (Immediate)</option>
                    <option value="high">⚠️ High Priority</option>
                    <option value="medium">⚡ Medium Priority</option>
                    <option value="low">ℹ️ Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SLA Deadline Target (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="360"
                    value={assignSlaHours}
                    onChange={(e) => setAssignSlaHours(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dispatch Instructions / Operational Note
                </label>
                <textarea
                  rows={2}
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  placeholder="e.g. Inspect road crater, deploy repair crew and compacting machine."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                />
              </div>

              {actionError && (
                <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {actionError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTriageModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-heading">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Verify & Accept Civic Report
              </h3>
              <button
                onClick={() => setTriageModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Verification Audit Note (Optional)
                </label>
                <textarea
                  rows={3}
                  value={verifyNote}
                  onChange={(e) => setVerifyNote(e.target.value)}
                  placeholder="e.g. Validated location on GIS. Severity confirmed. Approved for municipal repair routing."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note Visibility
                </label>
                <select
                  value={verifyVisibility}
                  onChange={(e) => setVerifyVisibility(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-green-600"
                >
                  <option value="public">Public (Visible to Citizen)</option>
                  <option value="internal">Internal (Admins & Workers Only)</option>
                </select>
              </div>

              {actionError && (
                <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {actionError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTriageModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading ? 'Accepting...' : 'Confirm Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Reject Modal */}
      {triageModal === 'reject' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-heading">
                <XCircle className="w-5 h-5 text-red-600" />
                Reject Civic Report
              </h3>
              <button
                onClick={() => setTriageModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rejection Classification
                </label>
                <select
                  value={rejectionCategory}
                  onChange={(e) => setRejectionCategory(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-red-600"
                >
                  {REJECTION_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Rejection Explanation <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain clearly to the citizen why this report cannot be resolved by the municipal corporation (min 10 chars)..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100"
                />
              </div>

              {actionError && (
                <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {actionError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTriageModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-heading">
                <HelpCircle className="w-5 h-5 text-amber-600" />
                Request Information from Citizen
              </h3>
              <button
                onClick={() => setTriageModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestInfoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clarification Prompt <span className="text-amber-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={infoMessage}
                  onChange={(e) => setInfoMessage(e.target.value)}
                  placeholder="Specify what details are missing (e.g. Landmark is ambiguous, please clarify building name or pole ID)..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-100"
                />
              </div>

              {actionError && (
                <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {actionError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTriageModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Worker Start Work Confirmation Modal */}
      {workerModal === 'start_work' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-heading">
                <Play className="w-5 h-5 text-amber-600 fill-amber-600" />
                Start Work on Site
              </h3>
              <button
                onClick={() => setWorkerModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStartWorkSubmit} className="space-y-4">
              <p className="text-sm text-slate-700">
                You are about to mark this civic repair task as{' '}
                <strong className="text-amber-700 font-semibold">In Progress</strong>. The reporting citizen and municipal dashboard will be notified of your on-site activity.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Arrival / Site Preparation Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={startWorkNote}
                  onChange={(e) => setStartWorkNote(e.target.value)}
                  placeholder="e.g. Arrived at incident location with repair crew and equipment."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-100"
                />
              </div>

              {actionError && (
                <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {actionError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setWorkerModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Confirm Work Started'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Worker Add Progress Update Modal */}
      {workerModal === 'progress_update' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-heading">
                <Wrench className="w-5 h-5 text-amber-600" />
                Log Repair Progress & Materials
              </h3>
              <button
                onClick={() => setWorkerModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProgressSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Progress Note <span className="text-amber-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  placeholder="Detail work performed (e.g. excavated damaged pipeline, cleared drainage, applied patch)..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Materials, Tools & Machinery Used (Optional)
                </label>
                <input
                  type="text"
                  value={materialsUsed}
                  onChange={(e) => setMaterialsUsed(e.target.value)}
                  placeholder="e.g. 2x PVC pipes, 50kg cement, 1x backhoe loader"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-100"
                />
              </div>

              {/* Stage Photos Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  On-Site Progress Photos
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-300 transition">
                    <Upload className="w-3.5 h-3.5 text-amber-600" />
                    <span>Upload Stage Photos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleProgressPhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {uploadingProgressPhotos && (
                    <span className="text-xs text-amber-600 animate-pulse font-medium">Uploading photos...</span>
                  )}
                  {progressPhotos.length > 0 && (
                    <span className="text-xs text-green-700 font-semibold">
                      ✓ {progressPhotos.length} photo(s) attached
                    </span>
                  )}
                </div>

                {progressPhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {progressPhotos.map((url, i) => (
                      <div
                        key={url || i}
                        className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-300"
                      >
                        <img src={getImageUrl(url)} alt="Progress thumbnail" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Visibility Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="internalProgressCheck"
                  checked={isInternalProgress}
                  onChange={(e) => setIsInternalProgress(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="internalProgressCheck" className="text-xs text-slate-700 font-medium select-none">
                  Mark as internal operational note (hidden from citizen)
                </label>
              </div>

              {actionError && (
                <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {actionError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setWorkerModal(null);
                    setProgressPhotos([]);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Submit Progress Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Worker Resolution Proof Modal */}
      {workerModal === 'resolve' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-heading">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Submit Resolution Proof & Close Work
              </h3>
              <button
                onClick={() => setWorkerModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <p className="text-xs text-slate-600">
                Submit completed photographic proof. The status will transition to{' '}
                <strong className="text-green-700 font-semibold">Resolved (Verification Pending)</strong> for citizen verification.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resolution Summary <span className="text-green-700">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  placeholder="Detail how the issue was resolved (e.g. Cleared 15m underground blockage and replaced damaged frame)..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100"
                />
              </div>

              {/* Mandatory Resolution Photos Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Mandatory Resolution Proof Photos <span className="text-green-700">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-800 text-xs font-semibold border border-green-300 transition">
                    <Upload className="w-3.5 h-3.5 text-green-700" />
                    <span>Upload After-Repair Photos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleResolutionPhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {uploadingResolutionPhotos && (
                    <span className="text-xs text-green-700 animate-pulse font-medium">Uploading photos...</span>
                  )}
                  {resolutionPhotos.length > 0 && (
                    <span className="text-xs text-green-800 font-semibold">
                      ✓ {resolutionPhotos.length} proof photo(s) attached
                    </span>
                  )}
                </div>

                {resolutionPhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {resolutionPhotos.map((url, i) => (
                      <div
                        key={url || i}
                        className="relative w-14 h-14 rounded-xl overflow-hidden border border-green-300 ring-2 ring-green-100"
                      >
                        <img src={getImageUrl(url)} alt="Resolution proof" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Materials & Cost Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Materials Used (Optional)
                  </label>
                  <input
                    type="text"
                    value={materialsUsedResolution}
                    onChange={(e) => setMaterialsUsedResolution(e.target.value)}
                    placeholder="e.g. 50kg asphalt, 2 bolts"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-green-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Repair Cost (₹ INR Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={repairCost}
                    onChange={(e) => setRepairCost(e.target.value)}
                    placeholder="e.g. 3500"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-green-600"
                  />
                </div>
              </div>

              {actionError && (
                <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {actionError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setWorkerModal(null);
                    setResolutionPhotos([]);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading ? 'Submitting...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Citizen Confirm Resolution & Star Rating Modal */}
      {citizenModal === 'rating' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-heading">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Confirm Resolution & Rate Service
              </h3>
              <button
                onClick={() => setCitizenModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmResolutionSubmit} className="space-y-4">
              <p className="text-xs text-slate-600">
                Please rate the quality and timeliness of the municipal resolution. This will permanently mark the ticket as <strong className="text-green-700 font-semibold">Closed</strong>.
              </p>

              <div className="text-center py-2 space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Rate Resolution Quality
                </label>
                <div className="flex items-center justify-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingValue(star)}
                      className="p-1.5 text-2xl transition hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= ratingValue
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300 hover:text-amber-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-amber-700">
                  {ratingValue === 5
                    ? '★★★★★ Excellent (5/5)'
                    : ratingValue === 4
                    ? '★★★★☆ Very Good (4/5)'
                    : ratingValue === 3
                    ? '★★★☆☆ Satisfactory (3/5)'
                    : ratingValue === 2
                    ? '★★☆☆☆ Needs Improvement (2/5)'
                    : '★☆☆☆☆ Poor (1/5)'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Citizen Feedback / Appreciation Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={ratingFeedback}
                  onChange={(e) => setRatingFeedback(e.target.value)}
                  placeholder="e.g. Prompt action by the field team! Road was cleared and asphalt looks solid."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100"
                />
              </div>

              {actionError && (
                <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {actionError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCitizenModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading ? 'Closing...' : 'Confirm Closure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Citizen Reopen Issue Modal */}
      {citizenModal === 'reopen' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-heading">
                <RotateCcw className="w-5 h-5 text-red-600" />
                Reopen Civic Ticket
              </h3>
              <button
                onClick={() => setCitizenModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReopenSubmit} className="space-y-4">
              <p className="text-xs text-slate-600">
                If the reported civic hazard was not adequately fixed or persists, please specify the exact defect. Status will transition to <strong className="text-red-600 font-semibold">Reopened</strong>.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Reopening <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={reopenReasonText}
                  onChange={(e) => setReopenReasonText(e.target.value)}
                  placeholder="Explain clearly why the fix is defective or incomplete (min 10 chars)..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100"
                />
              </div>

              {/* Reopen Defect Photos */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  New Defect Photo Proof (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-300 transition">
                    <Upload className="w-3.5 h-3.5 text-red-600" />
                    <span>Upload Defect Photos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleReopenPhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {uploadingReopenPhotos && (
                    <span className="text-xs text-red-600 animate-pulse font-medium">Uploading...</span>
                  )}
                  {reopenPhotos.length > 0 && (
                    <span className="text-xs text-green-700 font-semibold">
                      ✓ {reopenPhotos.length} photo(s) attached
                    </span>
                  )}
                </div>

                {reopenPhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {reopenPhotos.map((url, i) => (
                      <div
                        key={url || i}
                        className="relative w-12 h-12 rounded-lg overflow-hidden border border-red-300"
                      >
                        <img src={url} alt="Reopen photo" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {actionError && (
                <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {actionError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setCitizenModal(null);
                    setReopenPhotos([]);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading ? 'Reopening...' : 'Confirm Reopen Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Citizen Withdraw Issue Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-heading">
                <XCircle className="w-5 h-5 text-red-600" />
                Withdraw Civic Report
              </h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Are you sure you want to withdraw this report? The status will update to <strong className="text-slate-900 font-semibold">Withdrawn</strong>, and municipal teams will be notified not to dispatch workers.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Withdrawal (Optional)
                </label>
                <textarea
                  rows={3}
                  value={withdrawalReason}
                  onChange={(e) => setWithdrawalReason(e.target.value)}
                  placeholder="e.g. Problem was fixed naturally, reported by mistake, or duplicate entry..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100"
                />
              </div>

              {actionError && (
                <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {actionError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Keep Active
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading ? 'Withdrawing...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Citizen Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-heading">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Permanently Delete Report
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                This action <strong className="text-red-600 font-bold">cannot be undone</strong>. This will completely remove ticket <strong className="font-mono text-slate-900">{issue.issueNumber}</strong> and its photos from municipal records.
              </p>

              {actionError && (
                <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {actionError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSubmit}
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading ? 'Deleting...' : 'Yes, Delete Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin: Add Worker to Roster Modal */}
      {showAddWorkerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-heading">
                <UserPlus className="w-5 h-5 text-brand-700" />
                Assign Worker to Team Roster
              </h3>
              <button
                onClick={() => setShowAddWorkerModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddWorkerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Field Worker <span className="text-red-600">*</span>
                </label>
                <select
                  required
                  value={newWorkerId}
                  onChange={(e) => setNewWorkerId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                >
                  <option value="">Select Worker...</option>
                  {workers.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.department?.name || 'Field Dept'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Team Role / Specialization
                </label>
                <input
                  type="text"
                  value={newWorkerRole}
                  onChange={(e) => setNewWorkerRole(e.target.value)}
                  placeholder="e.g. Lead Engineer, Heavy Machinery Operator, Safety Officer"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Note / Special Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newWorkerNote}
                  onChange={(e) => setNewWorkerNote(e.target.value)}
                  placeholder="e.g. Assist in pothole compacting and traffic safety diversion."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                />
              </div>

              {actionError && (
                <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {actionError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddWorkerModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading ? 'Assigning...' : 'Assign Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3-Phase Work Execution Proof Upload Modal */}
      {phaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-heading">
                <Camera className="w-5 h-5 text-brand-700" />
                Upload {phaseModal === 'starting' ? 'Phase 1: Starting Arrival' : phaseModal === 'during' ? 'Phase 2: In-Progress Work' : 'Phase 3: Final Completion'} Proof
              </h3>
              <button
                onClick={() => {
                  setPhaseModal(null);
                  setPhaseImages([]);
                  setPhaseGpsVerified(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePhaseProofSubmit} className="space-y-4">
              <p className="text-xs text-slate-600">
                Please attach camera photos from the site. GPS camera geo-tags will be automatically verified against municipal issue coordinates.
              </p>

              {/* Photo Upload Area */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Geo-Tagged Evidence Photos <span className="text-red-600">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-xs font-semibold text-brand-700 border border-brand-200 transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Site Photos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhaseImageUpload}
                      className="hidden"
                    />
                  </label>
                  {uploadingPhaseImages && (
                    <span className="text-xs text-brand-700 animate-pulse font-medium">Extracting EXIF GPS & uploading...</span>
                  )}
                  {phaseImages.length > 0 && (
                    <span className="text-xs text-green-700 font-semibold">
                      ✓ {phaseImages.length} photo(s) attached
                    </span>
                  )}
                </div>

                {/* GPS Verification Badge */}
                {phaseGpsVerified && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <span className="font-bold">EXIF Camera GPS Verified: </span>
                      <span>{phaseGpsVerified.latitude?.toFixed(5)}° N, {phaseGpsVerified.longitude?.toFixed(5)}° E</span>
                      {phaseGpsVerified.timestamp && (
                        <span className="block text-[10px] text-emerald-600">
                          Captured: {new Date(phaseGpsVerified.timestamp).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Thumbnails */}
                {phaseImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {phaseImages.map((img, i) => (
                      <div
                        key={img.url || i}
                        className="relative w-16 h-16 rounded-xl overflow-hidden border border-brand-300 ring-2 ring-brand-100"
                      >
                        <img src={getImageUrl(img.url)} alt="Phase proof" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phase Operational Note / Field Summary (Optional)
                </label>
                <textarea
                  rows={2}
                  value={phaseNote}
                  onChange={(e) => setPhaseNote(e.target.value)}
                  placeholder="e.g. Field crew deployed barricades, excavated asphalt, compacted base layer..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                />
              </div>

              {actionError && (
                <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {actionError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setPhaseModal(null);
                    setPhaseImages([]);
                    setPhaseGpsVerified(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || uploadingPhaseImages}
                  className="px-5 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading ? 'Submitting Phase Proof...' : 'Submit Phase Proof'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Modal with Geotag Metadata for Admins & Super Admins */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60 relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header info bar */}
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-brand-300 bg-brand-950/80 px-2.5 py-1 rounded-lg border border-brand-800/80">
                  {issue.issueNumber}
                </span>
                <span className="text-xs font-semibold text-slate-300 truncate max-w-md">
                  {issue.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Image Container */}
            <div className="flex-1 bg-black/90 flex items-center justify-center p-2 min-h-[300px] overflow-hidden">
              <img
                src={selectedPhoto}
                alt="Expanded photographic evidence preview"
                crossOrigin="anonymous"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=1200&auto=format&fit=crop&q=80';
                }}
                className="max-h-[65vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
              />
            </div>

            {/* Geotag Breakdown Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>Verified Live GeoTag</span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      [{typeof lat === 'number' ? lat.toFixed(6) : '0.000000'}° N, {typeof lng === 'number' ? lng.toFixed(6) : '0.000000'}° E]
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-lg">
                    {issue.location?.address || issue.serviceArea?.name || 'Panchali, Pachipenta, Parvathipuram, Andhra Pradesh'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedPhoto}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
                >
                  Open Original
                </a>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
