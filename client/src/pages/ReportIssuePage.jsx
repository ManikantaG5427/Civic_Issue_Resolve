import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { configAPI, issueAPI, uploadAPI } from '../services/api';
import LocationPickerMap from '../components/LocationPickerMap';
import MapPreview from '../components/MapPreview';
import {
  FilePlus2,
  Tag,
  MapPin,
  AlertTriangle,
  Clock,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Camera,
  UploadCloud,
  X,
} from 'lucide-react';

export default function ReportIssuePage() {
  // Form State
  const [categories, setCategories] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const [categoryId, setCategoryId] = useState('');
  const [serviceAreaId, setServiceAreaId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [landmark, setLandmark] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(17.4849);
  const [longitude, setLongitude] = useState(78.3967);

  // Evidence Image Upload State (Queue 6)
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const fileInputRef = useRef(null);

  // Geospatial Duplicate Detection State (Queue 18)
  const [nearbyDuplicates, setNearbyDuplicates] = useState([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [dismissedDuplicates, setDismissedDuplicates] = useState(false);
  const [upvotedIssues, setUpvotedIssues] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [submittedIssue, setSubmittedIssue] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [catsRes, areasRes] = await Promise.all([
          configAPI.getCategories(),
          configAPI.getServiceAreas(),
        ]);
        setCategories(catsRes.data || []);
        setServiceAreas(areasRes.data || []);

        if (catsRes.data?.length > 0) {
          setCategoryId(catsRes.data[0]._id);
        }
        if (areasRes.data?.length > 0) {
          setServiceAreaId(areasRes.data[0]._id);
          setAddress(`${areasRes.data[0].name}, ${areasRes.data[0].city}`);
          if (areasRes.data[0].centerLocation?.coordinates) {
            setLongitude(areasRes.data[0].centerLocation.coordinates[0]);
            setLatitude(areasRes.data[0].centerLocation.coordinates[1]);
          }
        }
      } catch {
        setFormError('Failed to load civic categories. Please make sure data is seeded.');
      } finally {
        setLoadingConfig(false);
      }
    };

    loadConfig();
  }, []);

  // Debounced duplicate detection query when location or category changes
  useEffect(() => {
    if (!latitude || !longitude) return;
    setDismissedDuplicates(false);
    const timer = setTimeout(async () => {
      try {
        setCheckingDuplicates(true);
        const res = await issueAPI.getNearbyDuplicates({
          latitude,
          longitude,
          category: categoryId || undefined,
          maxDistanceMeters: 250,
        });
        if (res.data?.duplicates) {
          setNearbyDuplicates(res.data.duplicates);
        }
      } catch (err) {
        // Non-blocking background check
      } finally {
        setCheckingDuplicates(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [latitude, longitude, categoryId]);

  const selectedCategory = categories.find((c) => c._id === categoryId);

  const handleLocationChange = (newLat, newLng) => {
    setLatitude(newLat);
    setLongitude(newLng);
  };

  const handleToggleUpvoteDuplicate = async (dupId) => {
    try {
      const res = await issueAPI.toggleUpvote(dupId);
      if (res.data) {
        setUpvotedIssues((prev) => ({
          ...prev,
          [dupId]: res.data.hasUpvoted,
        }));
        setNearbyDuplicates((prev) =>
          prev.map((d) =>
            (d._id === dupId || d.issueNumber === dupId)
              ? {
                  ...d,
                  hasUpvoted: res.data.hasUpvoted,
                  upvoteCount: res.data.upvoteCount,
                }
              : d
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Image Selection Handler
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const newValidFiles = [];
    const newPreviewList = [...previewUrls];

    for (const file of files) {
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        setFormError(`File '${file.name}' is not supported. Use JPG, PNG, or WEBP.`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setFormError(`File '${file.name}' exceeds the 5MB maximum size limit.`);
        return;
      }

      if (selectedFiles.length + newValidFiles.length >= 3) {
        setFormError('You can upload a maximum of 3 evidence images per report.');
        break;
      }

      newValidFiles.push(file);
      newPreviewList.push({
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2),
        url: URL.createObjectURL(file),
      });
    }

    setSelectedFiles((prev) => [...prev, ...newValidFiles]);
    setPreviewUrls(newPreviewList);
    setFormError('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove Selected Image
  const handleRemoveImage = (indexToRemove) => {
    // Revoke object URL to avoid memory leak
    if (previewUrls[indexToRemove]?.url) {
      URL.revokeObjectURL(previewUrls[indexToRemove].url);
    }

    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setPreviewUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFieldErrors([]);

    if (title.trim().length < 5) {
      setFormError('Title must be at least 5 characters long');
      return;
    }

    if (description.trim().length < 15) {
      setFormError('Please provide a detailed description (minimum 15 characters)');
      return;
    }

    if (!landmark.trim()) {
      setFormError('A recognizable landmark is required to locate the issue');
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedEvidence = [];

      // Upload selected evidence photos if any
      if (selectedFiles.length > 0) {
        setUploadStatusText(`Uploading ${selectedFiles.length} evidence photo(s)...`);
        const uploadRes = await uploadAPI.uploadEvidence(selectedFiles, 'initial');
        if (uploadRes.success && uploadRes.data) {
          uploadedEvidence = uploadRes.data;
        }
      }

      setUploadStatusText('Saving civic issue report...');

      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: categoryId,
        serviceArea: serviceAreaId,
        landmark: landmark.trim(),
        address: address.trim() || 'Kukatpally, Hyderabad',
        coordinates: [longitude, latitude], // [Lng, Lat]
        evidence: uploadedEvidence,
      };

      const response = await issueAPI.createIssue(payload);

      if (response.success && response.data) {
        setSubmittedIssue(response.data);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to submit civic issue report');
      if (err.errors) {
        setFieldErrors(err.errors);
      }
    } finally {
      setIsSubmitting(false);
      setUploadStatusText('');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'high':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-slate-300 bg-slate-800 border-slate-700';
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (submittedIssue) {
    const issueLat = submittedIssue.location?.coordinates
      ? submittedIssue.location.coordinates[1]
      : latitude;
    const issueLng = submittedIssue.location?.coordinates
      ? submittedIssue.location.coordinates[0]
      : longitude;

    return (
      <div className="min-h-[75vh] flex items-center justify-center py-8 px-4">
        <div className="max-w-xl w-full glass-panel p-8 sm:p-10 rounded-3xl border border-teal-500/30 bg-slate-900/80 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto border border-teal-500/30 shadow-lg shadow-teal-500/10">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
              Report Submitted Successfully
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Issue #{submittedIssue.issueNumber}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Your civic issue and photographic evidence have been registered for review in{' '}
              <span className="text-teal-400 font-semibold">{submittedIssue.serviceArea?.name}</span>.
            </p>
          </div>

          {/* Photo Evidence Gallery Preview (Queue 6) */}
          {submittedIssue.evidence?.length > 0 && (
            <div className="space-y-2 text-left">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 px-1">
                <Camera className="w-3.5 h-3.5 text-teal-400" />
                Attached Photo Evidence ({submittedIssue.evidence.length})
              </span>
              <div className="grid grid-cols-3 gap-2">
                {submittedIssue.evidence.map((item, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-xl overflow-hidden border border-slate-700/80 aspect-video bg-slate-950"
                  >
                    <img
                      src={`http://localhost:5000${item.url}`}
                      alt={`Evidence ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map Preview of Pinned Location */}
          <div className="space-y-2 text-left">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                Verified Incident Location:
              </span>
              <span className="font-mono text-slate-300">
                [{issueLng.toFixed(4)}, {issueLat.toFixed(4)}]
              </span>
            </div>
            <MapPreview latitude={issueLat} longitude={issueLng} height="160px" />
          </div>

          {/* Issue Summary Card */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 text-left text-xs sm:text-sm space-y-2.5">
            <div className="flex justify-between pb-2 border-b border-slate-800/80">
              <span className="text-slate-400">Issue Title:</span>
              <span className="text-white font-semibold truncate max-w-[280px]">
                {submittedIssue.title}
              </span>
            </div>

            <div className="flex justify-between pb-2 border-b border-slate-800/80">
              <span className="text-slate-400">Category:</span>
              <span className="text-teal-300 font-medium">{submittedIssue.category?.name}</span>
            </div>

            <div className="flex justify-between pb-2 border-b border-slate-800/80">
              <span className="text-slate-400">Status:</span>
              <span className="text-amber-400 font-bold uppercase font-mono text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {submittedIssue.status}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Landmark:</span>
              <span className="text-slate-200">{submittedIssue.location?.landmark}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-teal-500/20"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => {
                setSubmittedIssue(null);
                setTitle('');
                setDescription('');
                setLandmark('');
                setSelectedFiles([]);
                setPreviewUrls([]);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-sm border border-slate-700 transition"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Report Another Issue</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-teal-950/30">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shadow-md">
            <FilePlus2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Report a Civic Issue
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Submit photo evidence, pinpoint GPS location, and describe the civic problem for municipal repair.
            </p>
          </div>
        </div>
      </div>

      {/* Main Report Form */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/70 shadow-2xl">
        {loadingConfig && (
          <div className="py-8 flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mb-3" />
            <p className="text-sm text-slate-400">Loading civic categories and pilot service areas...</p>
          </div>
        )}

        {formError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start space-x-3 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{formError}</p>
              {fieldErrors.length > 0 && (
                <ul className="list-disc list-inside mt-1 text-xs opacity-90">
                  {fieldErrors.map((err, i) => (
                    <li key={i}>{err.message}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {!loadingConfig && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Queue 18: Geospatial Duplicate Detection Alert Card */}
            {nearbyDuplicates.length > 0 && !dismissedDuplicates && (
              <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-left space-y-4 animate-fade-in shadow-xl shadow-amber-950/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
                        <span>Similar Issues Found Nearby</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {nearbyDuplicates.length} Active in Proximity
                        </span>
                      </h3>
                      <p className="text-xs text-amber-300/80 mt-0.5">
                        Other citizens have reported issues near your pinned location. Upvoting existing reports boosts municipal priority without creating duplicate tickets!
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDismissedDuplicates(true)}
                    className="text-xs text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                    title="Dismiss alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {nearbyDuplicates.map((dup) => {
                    const isUpvoted = upvotedIssues[dup._id] || dup.hasUpvoted;

                    return (
                      <div
                        key={dup._id}
                        className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/20 hover:border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {dup.issueNumber}
                            </span>
                            <span className="text-xs font-semibold text-white truncate max-w-[240px]">
                              {dup.title}
                            </span>
                            <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                              📍 ~{dup.distanceMeters}m away
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {dup.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleUpvoteDuplicate(dup._id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                              isUpvoted
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                                : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-750'
                            }`}
                          >
                            <span>👍 Upvote</span>
                            <span className="font-bold">
                              {dup.upvoteCount + (isUpvoted && !dup.hasUpvoted ? 1 : 0)}
                            </span>
                          </button>

                          <Link
                            to={`/issues/${dup.issueNumber || dup._id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-medium transition"
                          >
                            <span>View</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    Not the same issue? You can still file your new report below.
                  </span>
                  <button
                    type="button"
                    onClick={() => setDismissedDuplicates(true)}
                    className="text-amber-400 hover:underline font-medium"
                  >
                    Dismiss & Proceed with Form
                  </button>
                </div>
              </div>
            )}

            {/* Category & Service Area Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-teal-400" />
                  Civic Category *
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id} className="bg-slate-900 text-white">
                      {c.name}
                    </option>
                  ))}
                </select>

                {selectedCategory && (
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-teal-400" />
                      Target SLA: {selectedCategory.estimatedSlaHours}h
                    </span>
                    <span
                      className={`uppercase font-semibold px-2 py-0.2 rounded border ${getPriorityColor(
                        selectedCategory.defaultPriority
                      )}`}
                    >
                      {selectedCategory.defaultPriority} Priority
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  Service Jurisdiction Area *
                </label>
                <select
                  required
                  value={serviceAreaId}
                  onChange={(e) => setServiceAreaId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                >
                  {serviceAreas.map((area) => (
                    <option key={area._id} value={area._id} className="bg-slate-900 text-white">
                      {area.name} ({area.city})
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Pilot testing area for rapid response and resolution
                </p>
              </div>
            </div>

            {/* Title */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Issue Title *
                </label>
                <span className={`text-[11px] font-mono ${title.length > 100 ? 'text-amber-400' : 'text-slate-500'}`}>
                  {title.length}/120
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep pothole causing hazardous traffic near Metro pillar 124"
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Detailed Description *
                </label>
                <span className="text-[11px] font-mono text-slate-500">
                  {description.length}/2000
                </span>
              </div>
              <textarea
                required
                rows={3}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue severity, whether traffic or drinking water is affected, and any safety hazards..."
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition resize-y"
              />
            </div>

            {/* Landmark & Street Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Prominent Landmark *
                </label>
                <input
                  type="text"
                  required
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Opposite KPHB Bus Stop / Metro Pillar 124"
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Street / Area Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Road No. 1, Kukatpally Housing Board Colony"
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                />
              </div>
            </div>

            {/* Photo Evidence Upload Section (Queue 6) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-teal-400" />
                  Attach Evidence Photos (Max 3, 5MB each)
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {selectedFiles.length}/3 selected
                </span>
              </div>

              {/* Upload Drop Area */}
              {selectedFiles.length < 3 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700/80 hover:border-teal-500/60 bg-slate-900/40 hover:bg-slate-900/70 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-teal-500/10 group-hover:text-teal-400 text-slate-400 flex items-center justify-center transition">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-teal-400 hover:underline">
                      Click to choose photos
                    </span>
                    <span className="text-xs text-slate-400"> or drag and drop</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Supports JPG, JPEG, PNG, WEBP (Up to 5MB each)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}

              {/* Selected Photo Thumbnails Preview */}
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {previewUrls.map((preview, index) => (
                    <div
                      key={index}
                      className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 aspect-video group"
                    >
                      <img
                        src={preview.url}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-between p-2">
                        <span className="text-[10px] text-slate-200 truncate max-w-[80px]">
                          {preview.size} MB
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="p-1 rounded-md bg-rose-500/80 hover:bg-rose-500 text-white transition shadow"
                          title="Remove image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Leaflet Location Picker Map */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <LocationPickerMap
                latitude={latitude}
                longitude={longitude}
                onChange={handleLocationChange}
                height="300px"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{uploadStatusText || 'Submitting Report...'}</span>
                </>
              ) : (
                <>
                  <span>Submit Civic Issue Report</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
