import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { configAPI } from '../services/api';
import { exportToCSV, exportToJSON } from '../utils/exportUtils';
import {
  MapPin,
  Building2,
  Tag,
  Clock,
  Layers,
  RefreshCw,
  AlertCircle,
  Phone,
  Mail,
  Plus,
  Download,
  X,
  CheckCircle2,
  Compass,
} from 'lucide-react';

export default function ConfigCatalogPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrator' || user?.role === 'super_admin';

  const [data, setData] = useState({
    serviceAreas: [],
    departments: [],
    categories: [],
  });
  const [activeTab, setActiveTab] = useState('serviceAreas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal State for adding new config entries
  const [modalType, setModalType] = useState(null); // 'serviceArea' | 'department' | 'category' | null
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Service Area Form State
  const [areaForm, setAreaForm] = useState({
    name: '',
    code: '',
    city: 'Hyderabad',
    state: 'Telangana',
    pincodes: '',
    lng: '78.3967',
    lat: '17.4849',
    description: '',
  });

  // Department Form State
  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    contactEmail: '',
    contactPhone: '',
    defaultSlaHours: 48,
    description: '',
  });

  // Category Form State
  const [catForm, setCatForm] = useState({
    name: '',
    code: '',
    defaultDepartment: '',
    defaultPriority: 'medium',
    estimatedSlaHours: 48,
    requiresProofImage: true,
    description: '',
  });

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

  // Export handlers
  const handleExportCSV = () => {
    if (activeTab === 'serviceAreas') {
      const exportData = data.serviceAreas.map((sa) => ({
        name: sa.name,
        code: sa.code,
        city: sa.city,
        state: sa.state,
        pincodes: (sa.pincodes || []).join(', '),
        coordinates: sa.centerLocation?.coordinates ? `[${sa.centerLocation.coordinates.join(', ')}]` : '',
        description: sa.description || '',
        active: sa.isActive ? 'YES' : 'NO',
      }));
      exportToCSV(exportData, 'Civic_Service_Areas');
    } else if (activeTab === 'departments') {
      const exportData = data.departments.map((d) => ({
        name: d.name,
        code: d.code,
        email: d.contactEmail || '',
        phone: d.contactPhone || '',
        slaHours: d.defaultSlaHours || 48,
        description: d.description || '',
        active: d.isActive ? 'YES' : 'NO',
      }));
      exportToCSV(exportData, 'Civic_Departments');
    } else {
      const exportData = data.categories.map((c) => ({
        name: c.name,
        code: c.code,
        department: c.defaultDepartment?.name || '',
        priority: c.defaultPriority || 'medium',
        slaHours: c.estimatedSlaHours || 48,
        requiresImage: c.requiresProofImage ? 'YES' : 'NO',
        description: c.description || '',
      }));
      exportToCSV(exportData, 'Civic_Issue_Categories');
    }
  };

  const handleExportJSON = () => {
    exportToJSON(data, 'Civic_Configuration_Master_Catalog');
  };

  // Submission handlers
  const handleCreateServiceArea = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!areaForm.name.trim() || !areaForm.code.trim()) {
      setFormError('Area Name and Code are required.');
      return;
    }
    const lng = parseFloat(areaForm.lng);
    const lat = parseFloat(areaForm.lat);
    if (isNaN(lng) || isNaN(lat)) {
      setFormError('Valid numeric Longitude and Latitude are required.');
      return;
    }

    setSubmitting(true);
    try {
      const pincodeList = areaForm.pincodes
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      await configAPI.createServiceArea({
        name: areaForm.name.trim(),
        code: areaForm.code.trim().toUpperCase(),
        city: areaForm.city.trim(),
        state: areaForm.state.trim(),
        pincodes: pincodeList,
        coordinates: [lng, lat],
        description: areaForm.description.trim(),
      });

      setSuccessMsg(`Service Area "${areaForm.name}" added successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setModalType(null);
      setAreaForm({
        name: '',
        code: '',
        city: 'Hyderabad',
        state: 'Telangana',
        pincodes: '',
        lng: '78.3967',
        lat: '17.4849',
        description: '',
      });
      fetchConfig();
    } catch (err) {
      setFormError(err.message || 'Failed to create service area.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!deptForm.name.trim() || !deptForm.code.trim()) {
      setFormError('Department Name and Code are required.');
      return;
    }

    setSubmitting(true);
    try {
      await configAPI.createDepartment({
        name: deptForm.name.trim(),
        code: deptForm.code.trim().toUpperCase(),
        contactEmail: deptForm.contactEmail.trim(),
        contactPhone: deptForm.contactPhone.trim(),
        defaultSlaHours: Number(deptForm.defaultSlaHours) || 48,
        description: deptForm.description.trim(),
      });

      setSuccessMsg(`Department "${deptForm.name}" added successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setModalType(null);
      setDeptForm({
        name: '',
        code: '',
        contactEmail: '',
        contactPhone: '',
        defaultSlaHours: 48,
        description: '',
      });
      fetchConfig();
    } catch (err) {
      setFormError(err.message || 'Failed to create department.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!catForm.name.trim() || !catForm.code.trim() || !catForm.defaultDepartment) {
      setFormError('Category Name, Code, and Default Department are required.');
      return;
    }

    setSubmitting(true);
    try {
      await configAPI.createCategory({
        name: catForm.name.trim(),
        code: catForm.code.trim().toUpperCase(),
        defaultDepartment: catForm.defaultDepartment,
        defaultPriority: catForm.defaultPriority,
        estimatedSlaHours: Number(catForm.estimatedSlaHours) || 48,
        requiresProofImage: catForm.requiresProofImage,
        description: catForm.description.trim(),
      });

      setSuccessMsg(`Category "${catForm.name}" added successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setModalType(null);
      setCatForm({
        name: '',
        code: '',
        defaultDepartment: '',
        defaultPriority: 'medium',
        estimatedSlaHours: 48,
        requiresProofImage: true,
        description: '',
      });
      fetchConfig();
    } catch (err) {
      setFormError(err.message || 'Failed to create category.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center shadow-sm">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-heading">
                  Civic Configuration & Master Registry
                </h1>
                <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                  Master Catalog
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Foundational categories, municipal departments, and operational jurisdiction service areas.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isAdmin && (
              <button
                onClick={() => {
                  setFormError(null);
                  if (activeTab === 'serviceAreas') setModalType('serviceArea');
                  else if (activeTab === 'departments') setModalType('department');
                  else setModalType('category');
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold shadow-sm transition active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {activeTab === 'serviceAreas'
                    ? 'Add Service Area / Location'
                    : activeTab === 'departments'
                    ? 'Add Department'
                    : 'Add Category'}
                </span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-sm transition"
              title="Export active catalog view to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-sm transition"
              title="Export complete catalog JSON"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={fetchConfig}
              disabled={loading}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-700' : ''}`} />
              <span>Reload</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-slate-200">
          <button
            onClick={() => setActiveTab('serviceAreas')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
              activeTab === 'serviceAreas'
                ? 'bg-brand-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Service Areas & Locations ({data.serviceAreas.length})</span>
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
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Failed to Load Configuration</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-brand-700 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Loading civic configuration metadata...</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Service Areas Tab */}
          {activeTab === 'serviceAreas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.serviceAreas.map((area) => (
                <div
                  key={area._id || area.code}
                  className="p-6 rounded-2xl border border-slate-200 bg-white hover:shadow-card space-y-4 shadow-soft transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center border border-brand-200">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-bold uppercase text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                      {area.code}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-slate-900 font-heading">{area.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      {area.city}, {area.state} · India
                    </p>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{area.description || 'Jurisdiction zone active.'}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Center Coordinates:</span>
                      <span className="text-slate-800 font-mono font-medium">
                        {area.centerLocation?.coordinates
                          ? `[${area.centerLocation.coordinates[0]}, ${area.centerLocation.coordinates[1]}]`
                          : 'Configured'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Covered Pincodes:</span>
                      <span className="text-brand-700 font-mono font-semibold truncate max-w-[160px]">
                        {area.pincodes?.length > 0 ? area.pincodes.join(', ') : 'Standard Postal Zone'}
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
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{dept.description || 'Municipal department division.'}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-brand-700" />
                      <a
                        href={`mailto:${dept.contactEmail || 'operations@civicresolve.org'}`}
                        className="hover:underline hover:text-brand-700 transition"
                      >
                        {dept.contactEmail || 'operations@civicresolve.org'}
                      </a>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-brand-700" />
                      <a
                        href={`tel:${dept.contactPhone || '+914023456700'}`}
                        className="hover:underline hover:text-brand-700 transition"
                      >
                        {dept.contactPhone || '+91 40 2345 6700'}
                      </a>
                    </div>
                    <div className="flex items-center justify-between pt-1 text-slate-500">
                      <span>Standard SLA Target:</span>
                      <span className="text-brand-700 font-bold">{dept.defaultSlaHours} Hours</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

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
                    <p className="text-xs text-slate-600 leading-relaxed">{cat.description || 'Public defect classification.'}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-500">
                    <div className="flex items-center justify-between">
                      <span>Assigned Dept:</span>
                      <span className="text-slate-900 font-semibold truncate max-w-[130px]">
                        {cat.defaultDepartment?.name || 'Municipal Review'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>SLA Window:</span>
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
        </>
      )}

      {/* ADD SERVICE AREA / LOCATION MODAL */}
      {modalType === 'serviceArea' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center border border-brand-200">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-heading">Add Service Area / Location</h3>
                  <p className="text-xs text-slate-500">Create new municipal operational jurisdiction zone</p>
                </div>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateServiceArea} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Zone Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Madhapur IT Corridor"
                    value={areaForm.name}
                    onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Zone Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SA-HYD-04"
                    value={areaForm.code}
                    onChange={(e) => setAreaForm({ ...areaForm, code: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={areaForm.city}
                    onChange={(e) => setAreaForm({ ...areaForm, city: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={areaForm.state}
                    onChange={(e) => setAreaForm({ ...areaForm, state: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Covered Pincodes (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. 500081, 500033, 500084"
                  value={areaForm.pincodes}
                  onChange={(e) => setAreaForm({ ...areaForm, pincodes: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Center Longitude (Lng)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="78.3967"
                    value={areaForm.lng}
                    onChange={(e) => setAreaForm({ ...areaForm, lng: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Center Latitude (Lat)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="17.4849"
                    value={areaForm.lat}
                    onChange={(e) => setAreaForm({ ...areaForm, lat: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Landmarks</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of jurisdiction zone boundaries..."
                  value={areaForm.description}
                  onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Save Service Area'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD DEPARTMENT MODAL */}
      {modalType === 'department' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center border border-brand-200">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-heading">Add Municipal Department</h3>
                  <p className="text-xs text-slate-500">Register a new government operational agency</p>
                </div>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Roads & Bridges Division"
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dept Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DEPT-ROADS"
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    placeholder="roads@civicresolve.gov"
                    value={deptForm.contactEmail}
                    onChange={(e) => setDeptForm({ ...deptForm, contactEmail: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 40 2345 6789"
                    value={deptForm.contactPhone}
                    onChange={(e) => setDeptForm({ ...deptForm, contactPhone: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default SLA Target (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="720"
                  value={deptForm.defaultSlaHours}
                  onChange={(e) => setDeptForm({ ...deptForm, defaultSlaHours: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department Scope Description</label>
                <textarea
                  rows={2}
                  placeholder="Primary municipal responsibilities and maintenance scope..."
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {modalType === 'category' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center border border-brand-200">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-heading">Add Civic Issue Category</h3>
                  <p className="text-xs text-slate-500">Configure issue taxonomy and automated routing</p>
                </div>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Potholes & Road Cracks"
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CAT-ROAD-01"
                    value={catForm.code}
                    onChange={(e) => setCatForm({ ...catForm, code: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default Department *</label>
                <select
                  required
                  value={catForm.defaultDepartment}
                  onChange={(e) => setCatForm({ ...catForm, defaultDepartment: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">Select Responsible Department</option>
                  {data.departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Priority</label>
                  <select
                    value={catForm.defaultPriority}
                    onChange={(e) => setCatForm({ ...catForm, defaultPriority: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical Priority</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated SLA (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="720"
                    value={catForm.estimatedSlaHours}
                    onChange={(e) => setCatForm({ ...catForm, estimatedSlaHours: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requiresProof"
                  checked={catForm.requiresProofImage}
                  onChange={(e) => setCatForm({ ...catForm, requiresProofImage: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <label htmlFor="requiresProof" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Require citizen/worker photo verification for issues under this category
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Description</label>
                <textarea
                  rows={2}
                  placeholder="Defect criteria and qualification guidance..."
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
