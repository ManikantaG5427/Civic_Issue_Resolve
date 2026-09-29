import React, { useState, useEffect } from 'react';
import { configAPI } from '../services/api';
import {
  MapPin,
  Building2,
  Tag,
  Clock,
  Shield,
  Layers,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Phone,
  Mail,
  Zap,
  Droplet,
  Trash2,
  Trees,
  HardHat,
} from 'lucide-react';

export default function ConfigCatalogPage() {
  const [data, setData] = useState({
    serviceAreas: [],
    departments: [],
    categories: [],
  });
  const [activeTab, setActiveTab] = useState('categories');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await configAPI.getConfigSummary();
      setData({
        serviceAreas: summary.data?.serviceAreas || [],
        departments: summary.data?.departments || [],
        categories: summary.data?.categories || [],
      });
    } catch (err) {
      setError(err.message || 'Failed to load system configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-300 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-teal-950/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/10">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Civic System Configuration Catalog
                </h1>
                <span className="text-xs font-mono text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                  Queue 3
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Foundational categories, municipal departments, and pilot jurisdiction areas.
              </p>
            </div>
          </div>

          <button
            onClick={fetchConfig}
            disabled={loading}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
            <span>Reload Configuration</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
              activeTab === 'categories'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Civic Categories ({data.categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('departments')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
              activeTab === 'departments'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Departments ({data.departments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('serviceAreas')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
              activeTab === 'serviceAreas'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Pilot Service Areas ({data.serviceAreas.length})</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mb-3" />
          <p className="text-sm text-slate-400">Loading civic configuration metadata...</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Failed to Load Configuration</p>
            <p className="text-xs text-rose-400/80 mt-1">{error}</p>
            <p className="text-xs text-slate-400 mt-2">
              Tip: Run <code className="text-slate-200">npm run seed</code> to populate initial configuration data.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.categories.map((cat) => (
                <div
                  key={cat._id || cat.code}
                  className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded">
                        {cat.code}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${getPriorityBadge(
                          cat.defaultPriority
                        )}`}
                      >
                        {cat.defaultPriority}
                      </span>
                    </div>

                    <h4 className="text-base font-semibold text-white leading-snug">{cat.name}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{cat.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 text-xs space-y-1.5 text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Default Dept:</span>
                      <span className="text-slate-200 font-medium truncate max-w-[130px]">
                        {cat.defaultDepartment?.name || 'Assigned on Review'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>SLA Target:</span>
                      <span className="text-teal-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {cat.estimatedSlaHours} Hours
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Departments Tab */}
          {activeTab === 'departments' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.departments.map((dept) => (
                <div
                  key={dept._id || dept.code}
                  className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-semibold uppercase text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">
                      {dept.code}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white">{dept.name}</h4>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{dept.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center space-x-2 text-slate-300">
                      <Mail className="w-3.5 h-3.5 text-teal-400" />
                      <span>{dept.contactEmail || 'operations@civicresolve.org'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-teal-400" />
                      <span>{dept.contactPhone || '+91 40 2345 6700'}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 text-slate-400">
                      <span>Standard Resolution SLA:</span>
                      <span className="text-teal-400 font-semibold">{dept.defaultSlaHours} Hours</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Service Areas Tab */}
          {activeTab === 'serviceAreas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.serviceAreas.map((area) => (
                <div
                  key={area._id || area.code}
                  className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-semibold uppercase text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                      {area.code}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-white">{area.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {area.city}, {area.state} · India
                    </p>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">{area.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Jurisdiction Center:</span>
                      <span className="text-slate-200 font-mono">
                        {area.centerLocation?.coordinates
                          ? `[${area.centerLocation.coordinates[0]}, ${area.centerLocation.coordinates[1]}]`
                          : 'Coordinates configured'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Covered Pincodes:</span>
                      <span className="text-teal-400 font-mono">
                        {area.pincodes?.length > 0 ? area.pincodes.join(', ') : '500072, 500085, 500090'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
