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
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'medium':
        return 'bg-brand-50 text-brand-700 border-brand-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center shadow-sm">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-heading">
                  Civic System Configuration Catalog
                </h1>
                <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                  Catalog
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Foundational categories, municipal departments, and pilot jurisdiction areas.
              </p>
            </div>
          </div>

          <button
            onClick={fetchConfig}
            disabled={loading}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-700' : ''}`} />
            <span>Reload Configuration</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-slate-200">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
              activeTab === 'categories'
                ? 'bg-brand-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Civic Categories ({data.categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('departments')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
              activeTab === 'departments'
                ? 'bg-brand-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Departments ({data.departments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('serviceAreas')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
              activeTab === 'serviceAreas'
                ? 'bg-brand-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
          <RefreshCw className="w-8 h-8 text-brand-700 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Loading civic configuration metadata...</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Failed to Load Configuration</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
            <p className="text-xs text-slate-500 mt-2">
              Tip: Run <code className="text-slate-800 font-bold">npm run seed</code> to populate initial configuration data.
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
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-card transition flex flex-col justify-between space-y-4 shadow-soft"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {cat.code}
                      </span>
                      <span
                        className={`text-xs uppercase font-semibold px-2.5 py-0.5 rounded-full border ${getPriorityBadge(
                          cat.defaultPriority
                        )}`}
                      >
                        {cat.defaultPriority}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-snug font-heading">{cat.name}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{cat.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-500">
                    <div className="flex items-center justify-between">
                      <span>Default Dept:</span>
                      <span className="text-slate-900 font-semibold truncate max-w-[130px]">
                        {cat.defaultDepartment?.name || 'Assigned on Review'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>SLA Target:</span>
                      <span className="text-brand-700 font-bold flex items-center gap-1">
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
                  className="p-6 rounded-2xl border border-slate-200 bg-white hover:shadow-card space-y-4 shadow-soft transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center border border-brand-200">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-bold uppercase text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {dept.code}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900 font-heading">{dept.name}</h4>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{dept.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-brand-700" />
                      <a
                        href={`mailto:${dept.contactEmail || 'operations@civicresolve.org'}`}
                        className="hover:underline hover:text-[#0071E3] transition"
                      >
                        {dept.contactEmail || 'operations@civicresolve.org'}
                      </a>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-brand-700" />
                      <a
                        href={`tel:${dept.contactPhone || '+914023456700'}`}
                        className="hover:underline hover:text-[#0071E3] transition"
                      >
                        {dept.contactPhone || '+91 40 2345 6700'}
                      </a>
                    </div>
                    <div className="flex items-center justify-between pt-1 text-slate-500">
                      <span>Standard Resolution SLA:</span>
                      <span className="text-brand-700 font-bold">{dept.defaultSlaHours} Hours</span>
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
                  className="p-6 rounded-2xl border border-slate-200 bg-white hover:shadow-card space-y-4 shadow-soft transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-civic-50 text-civic-700 flex items-center justify-center border border-civic-200">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-bold uppercase text-civic-700 bg-civic-50 px-2.5 py-1 rounded-lg border border-civic-200">
                      {area.code}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-slate-900 font-heading">{area.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      {area.city}, {area.state} · India
                    </p>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{area.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Jurisdiction Center:</span>
                      <span className="text-slate-800 font-mono font-medium">
                        {area.centerLocation?.coordinates
                          ? `[${area.centerLocation.coordinates[0]}, ${area.centerLocation.coordinates[1]}]`
                          : 'Coordinates configured'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Covered Pincodes:</span>
                      <span className="text-brand-700 font-mono font-semibold">
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
