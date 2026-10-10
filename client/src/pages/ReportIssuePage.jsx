import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { configAPI, issueAPI, uploadAPI, getImageUrl } from '../services/api';
import LocationPickerMap from '../components/LocationPickerMap';
import MapPreview from '../components/MapPreview';
import LiveGpsMapCameraModal from '../components/LiveGpsMapCameraModal';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
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
  ThumbsUp,
  ShieldCheck,
  Building,
  Smartphone,
} from 'lucide-react';
import { extractExifGpsData } from '../utils/exifReader';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function ReportIssuePage() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  // Form State
  const [categories, setCategories] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [landmark, setLandmark] = useState('');
  const [address, setAddress] = useState('');
  const [detectedDistrict, setDetectedDistrict] = useState('');
  const [detectedState, setDetectedState] = useState('');
  const [detectedJurisdiction, setDetectedJurisdiction] = useState('');
  const [latitude, setLatitude] = useState(20.5937);
  const [longitude, setLongitude] = useState(78.9629);

  // Optional Guest Contact State (No login required)
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  // Live GPS Map Camera Modal State
  const [isGpsCameraOpen, setIsGpsCameraOpen] = useState(false);

  // Evidence Image Upload State
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const fileInputRef = useRef(null);

  // Geospatial Duplicate & Recurrence Detection State
  const [nearbyDuplicates, setNearbyDuplicates] = useState([]);
  const [recurrenceAlerts, setRecurrenceAlerts] = useState([]);
  const [dismissedDuplicates, setDismissedDuplicates] = useState(false);
  const [dismissedRecurrence, setDismissedRecurrence] = useState(false);
  const [upvotedIssues, setUpvotedIssues] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [submittedIssue, setSubmittedIssue] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const catsRes = await configAPI.getCategories();
        setCategories(catsRes.data || []);

        if (catsRes.data?.length > 0) {
          setCategoryId(catsRes.data[0]._id);
        }

        // Try getting user's real browser GPS coordinates across India/world
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = parseFloat(pos.coords.latitude.toFixed(6));
              const lng = parseFloat(pos.coords.longitude.toFixed(6));
              setLatitude(lat);
              setLongitude(lng);
            },
            () => {
              // Default to central India if location is unavailable
              setLatitude(20.5937);
              setLongitude(78.9629);
            },
            { timeout: 4000, maximumAge: 60000 }
          );
        }
      } catch {
        setFormError('Failed to load civic categories. Please make sure server is running.');
      } finally {
        setLoadingConfig(false);
      }
    };

    loadConfig();
  }, []);

  // Duplicate & Recurrence detection query
  useEffect(() => {
    if (!latitude || !longitude) return;
    setDismissedDuplicates(false);
    setDismissedRecurrence(false);
    const timer = setTimeout(async () => {
      try {
        const res = await issueAPI.getNearbyDuplicates({
          latitude,
          longitude,
          category: categoryId || undefined,
          maxDistanceMeters: 250,
        });
        if (res.data?.duplicates) {
          setNearbyDuplicates(res.data.duplicates);
        }
        if (res.data?.recurrenceAlerts) {
          setRecurrenceAlerts(res.data.recurrenceAlerts);
        }
      } catch {
        // Non-blocking
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [latitude, longitude, categoryId]);

  const selectedCategory = categories.find((c) => c._id === categoryId);

  const handleLocationChange = (newLat, newLng) => {
    setLatitude(newLat);
    setLongitude(newLng);
  };

  const handleAddressResolved = (fullAddress, geocodeData) => {
    if (fullAddress) {
      setAddress(fullAddress);

      const addr = geocodeData?.address || {};
      const cityOrDistrict =
        addr.city ||
        addr.state_district ||
        addr.county ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        'Municipal District';
      const stateName = addr.state || 'India';
      const jurisdictionLabel = `${cityOrDistrict} (${stateName})`;

      setDetectedDistrict(cityOrDistrict);
      setDetectedState(stateName);
      setDetectedJurisdiction(jurisdictionLabel);

      if (geocodeData?.extractedLandmark && !landmark.trim()) {
        setLandmark(geocodeData.extractedLandmark);
      } else if (!landmark.trim() && geocodeData?.address) {
        const candidateLandmark =
          addr.amenity ||
          addr.building ||
          addr.shop ||
          addr.place_of_worship ||
          addr.suburb ||
          addr.neighbourhood ||
          addr.road;
        if (candidateLandmark) {
          setLandmark(`Near ${candidateLandmark}`);
        }
      }
    }
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
            d._id === dupId || d.issueNumber === dupId
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

  const [gpsVerifiedBadge, setGpsVerifiedBadge] = useState(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const newValidFiles = [];
    const newPreviewList = [...previewUrls];

    for (const file of files) {
      if (!allowedTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpe?g|png|webp|heic|heif)$/i)) {
        setFormError(`File '${file.name}' is not supported. Use JPG, PNG, or WEBP.`);
        return;
      }

      if (file.size > 25 * 1024 * 1024) {
        setFormError(`File '${file.name}' exceeds the 25MB maximum size limit.`);
        return;
      }

      if (selectedFiles.length + newValidFiles.length >= 3) {
        setFormError('You can upload a maximum of 3 evidence images per report.');
        break;
      }

      // Extract Camera EXIF GPS Metadata
      const exif = await extractExifGpsData(file);
      file._geoTag = exif.hasGeoTag ? exif : null;

      if (exif.hasGeoTag) {
        setLatitude(exif.latitude);
        setLongitude(exif.longitude);
        setGpsVerifiedBadge(exif);
      }

      newValidFiles.push(file);
      newPreviewList.push({
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2),
        url: URL.createObjectURL(file),
        geoTag: exif.hasGeoTag ? exif : null,
      });
    }

    setSelectedFiles((prev) => [...prev, ...newValidFiles]);
    setPreviewUrls(newPreviewList);
    setFormError('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGpsPhotoCaptured = (captured) => {
    if (!captured) return;
    if (selectedFiles.length >= 3) {
      setFormError('You can upload a maximum of 3 evidence images per report.');
      return;
    }

    const file = captured.file;
    file._geoTag = {
      hasGeoTag: true,
      latitude: captured.latitude,
      longitude: captured.longitude,
      isGpsMapCamera: true,
    };

    setLatitude(captured.latitude);
    setLongitude(captured.longitude);
    if (captured.address && !address) {
      setAddress(captured.address);
    }
    if (captured.landmark && !landmark) {
      setLandmark(captured.landmark);
    }
    setGpsVerifiedBadge({
      hasGeoTag: true,
      latitude: captured.latitude,
      longitude: captured.longitude,
      isGpsMapCamera: true,
    });

    setSelectedFiles((prev) => [...prev, file]);
    setPreviewUrls((prev) => [
      ...prev,
      {
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2),
        url: captured.previewUrl,
        geoTag: file._geoTag,
      },
    ]);
    setFormError('');
  };

  const handleRemoveImage = (indexToRemove) => {
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

      if (selectedFiles.length > 0) {
        setUploadStatusText(`Uploading ${selectedFiles.length} evidence photo(s)...`);
        const uploadRes = await uploadAPI.uploadEvidence(selectedFiles, 'initial');
        if (uploadRes.success && uploadRes.data) {
          uploadedEvidence = uploadRes.data.map((item, idx) => ({
            ...item,
            geoTag: selectedFiles[idx]?._geoTag || null,
          }));
        }
      }

      setUploadStatusText('Saving civic issue report...');

      const hasCameraGps = Boolean(
        gpsVerifiedBadge || (uploadedEvidence && uploadedEvidence.some((e) => e.geoTag?.hasGeoTag))
      );

      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: categoryId,
        landmark: landmark.trim(),
        address: address.trim() || `${detectedDistrict || 'Municipal Area'}, ${detectedState || 'India'}`,
        city: detectedDistrict,
        district: detectedDistrict,
        state: detectedState,
        coordinates: [longitude, latitude],
        evidence: uploadedEvidence,
        isGpsVerified: hasCameraGps,
        guestName: guestName.trim() || (user ? user.name : 'Citizen'),
        guestPhone: guestPhone.trim() || (user ? user.phone || '' : ''),
        guestEmail: guestEmail.trim() || (user ? user.email || '' : ''),
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
        <div className="clay-card max-w-xl w-full p-8 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-sage-200 text-forest-800 flex items-center justify-center mx-auto border border-sage-300 shadow-soft">
            <CheckCircle2 className="w-9 h-9 text-forest-800" />
          </div>

          <div className="space-y-2">
            <span className="clay-pill text-xs font-mono font-bold uppercase tracking-wider text-forest-800 bg-sage-100">
              Report Submitted Successfully
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight font-heading">
              Ticket #{submittedIssue.issueNumber}
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-700 max-w-md mx-auto leading-relaxed">
              Your civic issue and photographic evidence have been registered for municipal dispatch in{' '}
              <span className="text-forest-800 font-bold">{submittedIssue.serviceArea?.name || 'Local Municipal Zone'}</span>.
            </p>
            <div className="p-3 bg-sage-100/80 border border-sage-300 rounded-2xl text-xs text-forest-950 font-medium">
              ✨ <strong>No Login Required:</strong> You can track this ticket's resolution progress anytime using the button below or by searching <strong>#{submittedIssue.issueNumber}</strong>.
            </div>
          </div>

          {/* Photo Evidence Gallery Preview */}
          {submittedIssue.evidence?.length > 0 && (
            <div className="space-y-2 text-left">
              <span className="text-xs font-bold text-charcoal-800 flex items-center gap-1.5 px-1">
                <Camera className="w-3.5 h-3.5 text-forest-700" />
                Attached Photo Evidence ({submittedIssue.evidence.length})
              </span>
              <div className="grid grid-cols-3 gap-2">
                {submittedIssue.evidence.map((item, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-2xl overflow-hidden border border-sand-300 aspect-video bg-sand-100 shadow-inner"
                  >
                    <img
                      src={getImageUrl(item.url)}
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
            <div className="flex items-center justify-between text-xs text-charcoal-600 px-1">
              <span className="flex items-center gap-1 font-semibold text-charcoal-800">
                <MapPin className="w-3.5 h-3.5 text-forest-700" />
                Verified Incident Location:
              </span>
              <span className="font-mono text-charcoal-700">
                [{issueLng.toFixed(4)}, {issueLat.toFixed(4)}]
              </span>
            </div>
            <MapPreview latitude={issueLat} longitude={issueLng} height="160px" />
          </div>

          {/* Issue Summary Card */}
          <div className="p-5 rounded-3xl bg-sand-50/80 border border-sand-200 text-left text-xs sm:text-sm space-y-2.5 shadow-inner">
            <div className="flex justify-between pb-2 border-b border-sand-200">
              <span className="text-charcoal-600 font-medium">Issue Title:</span>
              <span className="text-charcoal-900 font-bold truncate max-w-[280px]">
                {submittedIssue.title}
              </span>
            </div>

            <div className="flex justify-between pb-2 border-b border-sand-200">
              <span className="text-charcoal-600 font-medium">Category:</span>
              <span className="text-forest-800 font-bold">{submittedIssue.category?.name}</span>
            </div>

            <div className="flex justify-between pb-2 border-b border-sand-200">
              <span className="text-charcoal-600 font-medium">Status:</span>
              <StatusBadge status={submittedIssue.status} size="sm" />
            </div>

            <div className="flex justify-between">
              <span className="text-charcoal-600 font-medium">Landmark:</span>
              <span className="text-charcoal-800 font-medium">{submittedIssue.location?.landmark}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to={`/issues/${submittedIssue.issueNumber || submittedIssue._id}`} className="w-full sm:w-auto">
              <button type="button" className="clay-btn-primary w-full sm:w-auto px-6 py-3">
                Track Ticket Status
              </button>
            </Link>

            <button
              type="button"
              onClick={() => {
                setSubmittedIssue(null);
                setTitle('');
                setDescription('');
                setLandmark('');
                setSelectedFiles([]);
                setPreviewUrls([]);
              }}
              className="clay-btn-secondary w-full sm:w-auto px-6 py-3 inline-flex items-center justify-center gap-2"
            >
              <FilePlus2 className="w-4 h-4" />
              Report Another Issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title={t('report_title')}
        description={t('report_subtitle')}
      />

      <div className="clay-card p-6 sm:p-8">
        {loadingConfig && (
          <div className="py-8 flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 text-forest-700 animate-spin mb-3" />
            <p className="text-sm text-charcoal-700 font-medium">Loading civic categories...</p>
          </div>
        )}

        {formError && (
          <div className="mb-6 p-4 rounded-2xl bg-terracotta-50 border border-terracotta-200 text-terracotta-900 flex items-start space-x-3 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-terracotta-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{formError}</p>
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Life-Safety Emergency & Pilot Notice */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 flex items-start gap-3 text-xs shadow-xs">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-900 block">{t('emergency_title')}:</span>
                <span className="text-amber-800 leading-relaxed">
                  {t('emergency_disclaimer')}
                </span>
              </div>
            </div>

            {/* Recurrence Detection Alert Card */}
            {recurrenceAlerts.length > 0 && !dismissedRecurrence && (
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/90 border border-indigo-200 text-left space-y-3 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-inner">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-indigo-950 flex items-center gap-2">
                        <span>{t('recurrence_detected')}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-900">
                          {recurrenceAlerts.length} past fix(es) in area
                        </span>
                      </h3>
                      <p className="text-[11px] text-indigo-800 mt-0.5">
                        {t('recurrence_desc')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDismissedRecurrence(true)}
                    className="text-xs text-slate-500 hover:text-slate-800 p-1 rounded-lg hover:bg-indigo-100 transition"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {recurrenceAlerts.map((rec) => (
                    <div key={rec._id} className="p-2.5 rounded-xl bg-white border border-indigo-100 text-xs text-slate-700 flex items-center justify-between gap-2">
                      <div className="truncate">
                        <span className="font-mono font-bold text-indigo-700 mr-2">{rec.issueNumber}</span>
                        <span className="font-medium text-slate-800">{rec.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">Closed {rec.daysSinceClosure}d ago (~{rec.distanceMeters}m)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Duplicate Detection Alert Card */}
            {nearbyDuplicates.length > 0 && !dismissedDuplicates && (
              <div className="p-5 rounded-3xl bg-amber-50/90 border border-amber-300 text-left space-y-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800 border border-amber-200 shadow-inner">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2 font-heading">
                        <span>Similar Issues Reported Nearby</span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                          {nearbyDuplicates.length} Active in Proximity
                        </span>
                      </h3>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Other citizens have reported issues near your pinned location. Upvoting existing reports boosts municipal priority without creating duplicate tickets!
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDismissedDuplicates(true)}
                    className="text-xs text-charcoal-500 hover:text-charcoal-800 p-1.5 rounded-xl hover:bg-amber-100 transition"
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
                        className="p-3.5 rounded-2xl bg-white border border-amber-200 hover:border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition shadow-soft"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[11px] font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                              {dup.issueNumber}
                            </span>
                            <span className="text-xs font-bold text-charcoal-900 truncate max-w-[240px]">
                              {dup.title}
                            </span>
                            <span className="text-[10px] text-charcoal-600 bg-sand-100 px-2.5 py-0.5 rounded-full border border-sand-200 font-medium">
                              📍 ~{dup.distanceMeters}m away
                            </span>
                          </div>
                          <p className="text-[11px] text-charcoal-600 line-clamp-1">
                            {dup.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleUpvoteDuplicate(dup._id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                              isUpvoted
                                ? 'bg-amber-400 text-charcoal-950 border-amber-400 shadow-sm'
                                : 'bg-sand-50 hover:bg-sand-100 text-charcoal-700 border-sand-300'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Upvote ({dup.upvoteCount + (isUpvoted && !dup.hasUpvoted ? 1 : 0)})</span>
                          </button>

                          <Link
                            to={`/issues/${dup.issueNumber || dup._id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sage-100 hover:bg-sage-200 text-forest-800 border border-sage-300 text-xs font-bold transition"
                          >
                            <span>View</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-1 flex items-center justify-between text-xs">
                  <span className="text-charcoal-700 font-medium">
                    Not the same issue? You can still proceed with your new report below.
                  </span>
                  <button
                    type="button"
                    onClick={() => setDismissedDuplicates(true)}
                    className="text-amber-900 hover:underline font-bold"
                  >
                    Dismiss & Proceed
                  </button>
                </div>
              </div>
            )}

            {/* Category & Auto-Resolved Jurisdiction Header */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-charcoal-800 flex items-center gap-1">
                  <Tag className="w-4 h-4 text-forest-700" />
                  Civic Category *
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="clay-input w-full text-sm font-light text-charcoal-900 px-2 py-2 rounded-xl"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {selectedCategory && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-xs text-charcoal-600">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-forest-700" />
                        Target SLA: {selectedCategory.estimatedSlaHours}h
                      </span>
                      <PriorityBadge priority={selectedCategory.defaultPriority} size="sm" />
                    </div>
                    {selectedCategory.defaultDepartment && (
                      <div className="text-[11px] text-forest-800 font-medium flex items-center gap-1.5 pt-0.5">
                        <Building className="w-3 h-3 text-forest-700 shrink-0" />
                        <span>Auto-routed Department: <strong className="font-semibold text-forest-900">{selectedCategory.defaultDepartment.name || selectedCategory.defaultDepartment}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-charcoal-800 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-forest-700" />
                  Service Jurisdiction (Auto-Detected)
                </label>
                <div className="p-3 rounded-2xl bg-sand-50 border border-sand-200 text-xs flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-2 truncate">
                    <ShieldCheck className="w-4 h-4 text-forest-700 shrink-0" />
                    <span className="font-semibold text-charcoal-800 truncate">
                      {detectedJurisdiction || 'Auto-assigning zone via map location'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-forest-800 bg-sage-200 px-2.5 py-0.5 rounded-full border border-sage-300 shrink-0 ml-2">
                    Auto
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-charcoal-500">
                  Automatically routed to the responsible municipal corporation based on your pinned coordinates
                </p>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-charcoal-800">
                Issue Title *
              </label>
              <input
                type="text"
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Broken water pipeline causing waterlogging near main cross road"
                className="clay-input w-full text-sm text-charcoal-900 px-2 py-2 rounded-xl"
              />
              <span className="text-[11px] text-charcoal-500 mt-1 block">
                {title.length}/120 characters
              </span>
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-semibold text-charcoal-800 ">
                  Detailed Description *
                </label>
                <span className="text-xs font-mono text-charcoal-400 ">
                  {description.length}/2000
                </span>
              </div>
              <textarea
                required
                rows={3}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue severity, whether traffic or residents are affected, and safety hazards..."
                className="clay-input w-full text-sm text-charcoal-900 px-2 py-2 rounded-xl"
              />
            </div>

            {/* Map Pinpoint Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-semibold text-charcoal-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-forest-700" />
                    Pin Location on Map *
                  </label>
                  <p className="text-xs text-charcoal-500">
                    Search any Indian address, village, college, or use GPS to pinpoint exact location
                  </p>
                </div>

                <span className="font-mono text-xs text-forest-900 bg-sage-100 px-2.5 py-1 rounded-full border border-sage-300 font-bold">
                  {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </span>
              </div>

              <LocationPickerMap
                latitude={latitude}
                longitude={longitude}
                onChange={handleLocationChange}
                onAddressResolved={handleAddressResolved}
                height="320px"
              />
            </div>

            {/* Landmark & Address Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-charcoal-800">
                  Landmark *
                </label>
                <input
                  type="text"
                  required
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Apollo Hospital, Opp Metro Pillar 140"
                  className="clay-input w-full text-sm text-charcoal-900 px-2 py-2 rounded-xl"
                />
                <p className="mt-1 text-[11px] text-charcoal-500">
                  Extracted automatically from map or enter your nearest landmark
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-charcoal-800">
                  Resolved Street / Area Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, locality, city, district"
                  className="clay-input w-full text-sm text-charcoal-900 bg-sand-50 px-2 py-2 rounded-xl"
                />
              </div>
            </div>

            {/* Optional Contact Details for Citizens (No login required) */}
            {!isAuthenticated && (
              <div className="p-4 sm:p-5 rounded-3xl bg-sand-50/90 border border-sand-300 space-y-3 shadow-soft">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-forest-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-forest-900 font-heading">
                      Citizen Contact Info (Optional — No Account or Login Required)
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-forest-800 bg-sage-200 px-2.5 py-0.5 rounded-full border border-sage-300">
                    Guest Mode
                  </span>
                </div>
                <p className="text-[11px] text-charcoal-600 leading-relaxed">
                  You can submit your report 100% anonymously. Optionally provide your name or mobile number if you want the municipal team to reach you for location verification.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                      Your Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="clay-input w-full text-xs px-2 py-2 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                      Mobile Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="clay-input w-full text-xs px-2 py-2 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="e.g. ramesh@example.com"
                      className="clay-input w-full text-xs px-2 py-2 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Photographic Evidence Upload & Live GPS Camera */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="block text-sm font-semibold text-charcoal-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-forest-700" />
                  Upload Photo Evidence (Live GPS Map Camera for Android & iOS)
                </label>
                {gpsVerifiedBadge && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sage-200 text-forest-900 border border-sage-400 text-xs font-bold shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-forest-700" />
                    GPS Verified Photo Added
                  </span>
                )}
              </div>

              {/* Verified Camera GPS Banner if detected */}
              {gpsVerifiedBadge && (
                <div className="p-3.5 bg-sage-50 border border-sage-300 rounded-2xl text-xs text-forest-900 flex items-start gap-2.5 shadow-inner">
                  <ShieldCheck className="w-5 h-5 text-forest-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">GPS Coordinates Verified from Image: </span>
                    <span className="font-mono font-bold">
                      {gpsVerifiedBadge.latitude.toFixed(5)}, {gpsVerifiedBadge.longitude.toFixed(5)}
                    </span>
                    <span className="text-forest-700 block text-[11px] mt-0.5">
                      Auto-aligned incident map location to the exact spot where the photo was taken.
                    </span>
                  </div>
                </div>
              )}

              {/* Two Option Buttons: Live GPS Map Camera + File Upload */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Live GPS Map Camera Button */}
                <button
                  type="button"
                  onClick={() => setIsGpsCameraOpen(true)}
                  className="clay-card p-5 text-left border-2 border-dashed border-forest-400/80 hover:border-forest-600 bg-sage-50/60 hover:bg-sage-100/80 transition-all flex items-center gap-3.5 group cursor-pointer border-black"
                >
                  <div className="w-12 h-12 rounded-2xl bg-forest-800 text-sand-50 flex items-center justify-center shrink-0 shadow-soft group-hover:scale-105 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-forest-800 flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5" /> Live GPS Camera
                    </span>
                    <p className="text-xs font-bold text-charcoal-900 mt-0.5">
                      Open in-browser GPS Camera
                    </p>
                    <p className="text-[11px] text-charcoal-600 mt-0.5">
                      Auto-watermarks Lat/Lng, Address & Time
                    </p>
                  </div>
                </button>

                {/* 2. File Upload from GPS Camera App / Gallery */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="clay-card p-5 text-left border-2 border-dashed border-forest-400/80 hover:border-forest-600 bg-sage-50/60 hover:bg-sage-100/80 transition-all flex items-center gap-3.5 group cursor-pointer border-black"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-sand-200 text-charcoal-700 flex items-center justify-center shrink-0 shadow-inner group-hover:text-forest-800 transition-colors">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-charcoal-600">
                      Upload from Device
                    </span>
                    <p className="text-xs font-bold text-charcoal-900 mt-0.5">
                      Select Geotagged Photos
                    </p>
                    <p className="text-[11px] text-charcoal-600 mt-0.5">
                      Supports Android & iOS GPS Camera App files
                    </p>
                  </div>
                </div>
              </div>

              {previewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {previewUrls.map((file, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-2xl overflow-hidden aspect-square border border-sand-300 bg-sand-100 shadow-soft group"
                    >
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                      {file.geoTag && (
                        <div className="absolute top-2 left-2 bg-forest-800 text-sand-50 text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                          GPS Tagged
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-charcoal-900/80 text-white hover:bg-rose-600 transition shadow-md"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-sand-200 flex flex-col sm:flex-row items-center justify-end gap-3">
              <Link to="/my-reports" className="w-full sm:w-auto">
                <button type="button" className="clay-btn-secondary w-full sm:w-auto px-6 py-2 border-2 border-black border-rounded-10 hover:bg-green-100 rounded-xl">
                  Cancel
                </button>
              </Link>

              <button
                type="submit"
                disabled={isSubmitting}
                className="clay-btn-primary w-full sm:w-auto px-8 py-3 inline-flex items-center justify-center gap-2 border-2 border-black border-rounded-10 hover:bg-green-100 rounded-xl"
              >
                <FilePlus2 className="w-4 h-4" />
                {isSubmitting ? uploadStatusText || 'Submitting...' : 'Submit Civic Complaint'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Live GPS Map Camera Modal for Android, iOS & Web */}
      <LiveGpsMapCameraModal
        isOpen={isGpsCameraOpen}
        onClose={() => setIsGpsCameraOpen(false)}
        onPhotoCaptured={handleGpsPhotoCaptured}
      />
    </div>
  );
}

