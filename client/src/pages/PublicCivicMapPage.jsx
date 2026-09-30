import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Filter,
  Layers,
  FilePlus2,
  ExternalLink,
  Clock,
  ThumbsUp,
  Tag,
  Building2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Compass,
} from 'lucide-react';
import { issueAPI, configAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Create custom leaflet marker icons
const createCustomIcon = (status) => {
  let color = '#14b8a6'; // Teal
  if (['in_progress', 'assigned'].includes(status)) {
    color = '#f59e0b'; // Amber
  } else if (['resolved_verification_pending', 'closed'].includes(status)) {
    color = '#10b981'; // Emerald
  } else if (status === 'submitted') {
    color = '#0284c7'; // Sky
  }

  const svgHtml = `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: ${color}33; animation: pulse 2s infinite;"></div>
      <div style="width: 22px; height: 22px; border-radius: 50%; background-color: ${color}; border: 2.5px solid #020617; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
        <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #ffffff;"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-map-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || 14, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export default function PublicCivicMapPage() {
  const { isAuthenticated } = useAuth();
  const [issues, setIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedServiceArea, setSelectedServiceArea] = useState('all');
  const [activeIssue, setActiveIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default Map Center (Kukatpally Pilot Area)
  const [mapCenter, setMapCenter] = useState([17.4849, 78.3967]);
  const [mapZoom, setMapZoom] = useState(14);

  useEffect(() => {
    async function loadCatalogs() {
      try {
        const [catsRes, areasRes] = await Promise.all([
          configAPI.getCategories(),
          configAPI.getServiceAreas(),
        ]);
        if (catsRes.data) setCategories(catsRes.data);
        if (areasRes.data) {
          setServiceAreas(areasRes.data);
          if (areasRes.data[0]?.centerLocation?.coordinates) {
            const [lng, lat] = areasRes.data[0].centerLocation.coordinates;
            setMapCenter([lat, lng]);
          }
        }
      } catch (err) {
        console.error('Failed to load map catalogs', err);
      }
    }
    loadCatalogs();
  }, []);

  const fetchMapIssues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await issueAPI.getPublicMap({
        category: selectedCategory,
        status: selectedStatus,
        serviceArea: selectedServiceArea,
      });
      if (res.data?.issues) {
        setIssues(res.data.issues);
      }
    } catch (err) {
      setError(err.message || 'Failed to load public civic map data');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedStatus, selectedServiceArea]);

  useEffect(() => {
    fetchMapIssues();
  }, [fetchMapIssues]);

  const handleServiceAreaChange = (saId) => {
    setSelectedServiceArea(saId);
    if (saId === 'all') {
      setMapCenter([17.4849, 78.3967]);
      setMapZoom(13);
    } else {
      const sa = serviceAreas.find((s) => s._id === saId);
      if (sa?.centerLocation?.coordinates) {
        const [lng, lat] = sa.centerLocation.coordinates;
        setMapCenter([lat, lng]);
        setMapZoom(15);
      }
    }
  };

  return (
    <div className="space-y-4 animate-fade-in -mt-2">
      {/* Top Header & Filter Controls Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Public Civic Map Explorer
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  {issues.length} Verified Incidents
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Explore real-time municipal infrastructure repairs, verified civic reports, and ongoing field operations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/report-issue"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-teal-500/20 transition"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Report Issue Here</span>
            </Link>

            <button
              onClick={fetchMapIssues}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
              title="Refresh Map Markers"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Service Area Selector */}
          <select
            value={selectedServiceArea}
            onChange={(e) => handleServiceAreaChange(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-teal-500 transition"
          >
            <option value="all">All Pilot Areas</option>
            {serviceAreas.map((sa) => (
              <option key={sa._id} value={sa._id}>
                {sa.name} ({sa.code})
              </option>
            ))}
          </select>

          {/* Status Tabs */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            {[
              { label: 'All Statuses', value: 'all' },
              { label: 'Active Repairs', value: 'active' },
              { label: 'Resolved', value: 'resolved' },
            ].map((st) => (
              <button
                key={st.value}
                onClick={() => setSelectedStatus(st.value)}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  selectedStatus === st.value
                    ? 'bg-teal-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 text-xs rounded-xl border transition ${
                selectedCategory === 'all'
                  ? 'bg-slate-100 text-slate-950 font-bold border-slate-100'
                  : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                onClick={() => setSelectedCategory(c._id)}
                className={`px-3 py-1 text-xs rounded-xl border whitespace-nowrap transition ${
                  selectedCategory === c._id
                    ? 'bg-teal-500 text-slate-950 font-bold border-teal-500'
                    : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Map Canvas and Side Drawer Layout */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl h-[680px] bg-slate-950">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
        >
          <ChangeMapView center={mapCenter} zoom={mapZoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {issues.map((issue) => {
            const [lng, lat] = issue.location?.coordinates || [78.3967, 17.4849];
            const icon = createCustomIcon(issue.status);

            return (
              <Marker
                key={issue._id}
                position={[lat, lng]}
                icon={icon}
                eventHandlers={{
                  click: () => setActiveIssue(issue),
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 space-y-1.5 max-w-xs text-xs text-slate-900 font-sans">
                    <span className="font-mono text-[10px] font-bold text-teal-700 block">
                      {issue.issueNumber}
                    </span>
                    <strong className="block text-sm font-bold text-slate-950 leading-tight">
                      {issue.title}
                    </strong>
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {issue.description}
                    </p>
                    <div className="pt-1 flex items-center justify-between border-t border-slate-200">
                      <span className="text-[10px] font-semibold text-slate-500 capitalize">
                        {issue.status.replace(/_/g, ' ')}
                      </span>
                      <Link
                        to={`/issues/${issue.issueNumber || issue._id}`}
                        className="text-teal-600 hover:underline font-bold text-[11px]"
                      >
                        View Full Details →
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Selected Issue Side Drawer Overlay */}
        {activeIssue && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:top-4 sm:bottom-auto sm:w-96 p-5 rounded-3xl bg-slate-900/95 backdrop-blur-xl border border-teal-500/30 shadow-2xl z-20 space-y-3.5 animate-scale-in">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-lg border border-teal-500/20">
                  {activeIssue.issueNumber}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {activeIssue.status.replace(/_/g, ' ')}
                </span>
              </div>

              <button
                onClick={() => setActiveIssue(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo Thumbnail if available */}
            {activeIssue.evidence?.length > 0 && (
              <div className="rounded-2xl overflow-hidden aspect-video bg-slate-950 border border-slate-800">
                <img
                  src={`http://localhost:5000${activeIssue.evidence[0].url}`}
                  alt={activeIssue.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div>
              <h3 className="text-base font-bold text-white leading-snug">
                {activeIssue.title}
              </h3>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                {activeIssue.description}
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-slate-400 pt-1 border-t border-slate-800">
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-teal-400" />
                <span>{activeIssue.category?.name || 'Civic Infrastructure'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                <span className="truncate">{activeIssue.location?.address}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{activeIssue.upvoteCount || 0} citizen upvotes</span>
              </div>

              <Link
                to={`/issues/${activeIssue.issueNumber || activeIssue._id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition shadow-md shadow-teal-500/20"
              >
                <span>View Full Ticket</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
