import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { configAPI, issueAPI } from '../services/api';
import {
  FilePlus2,
  Tag,
  MapPin,
  AlertTriangle,
  Clock,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Compass,
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
  const [latitude, setLatitude] = useState('17.4849');
  const [longitude, setLongitude] = useState('78.3967');

  const [isSubmitting, setIsSubmitting] = useState(false);
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
        }
      } catch {
        setFormError('Failed to load civic categories. Please make sure data is seeded.');
      } finally {
        setLoadingConfig(false);
      }
    };

    loadConfig();
  }, []);

  const selectedCategory = categories.find((c) => c._id === categoryId);

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
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: categoryId,
        serviceArea: serviceAreaId,
        landmark: landmark.trim(),
        address: address.trim() || 'Kukatpally, Hyderabad',
        coordinates: [parseFloat(longitude) || 78.3967, parseFloat(latitude) || 17.4849],
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
              Your civic issue has been officially registered and queued for municipal administrator review in{' '}
              <span className="text-teal-400 font-semibold">{submittedIssue.serviceArea?.name}</span>.
            </p>
          </div>

          {/* Issue Summary Card */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 text-left text-xs sm:text-sm space-y-2.5">
            <div className="flex justify-between pb-2 border-b border-slate-800/80">
              <span className="text-slate-400">Issue Title:</span>
              <span className="text-white font-semibold">{submittedIssue.title}</span>
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
              Submit verifiable details for road, sanitation, water, or electrical issues in your neighborhood.
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
                rows={4}
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

            {/* Coordinates / GPS Preview (Queue 4 baseline, Leaflet map interactive pin in Queue 5) */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-teal-400" />
                  Geo-Coordinates [Lng, Lat]
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Default: Kukatpally Pilot Center
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Submitting Report...' : 'Submit Civic Issue Report'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
