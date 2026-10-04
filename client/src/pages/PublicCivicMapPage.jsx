import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  FilePlus2,
  ExternalLink,
  ThumbsUp,
  Tag,
  RefreshCw,
  X,
  Crosshair,
  Globe2,
  Search,
  Maximize2,
  Layers,
} from 'lucide-react';
import { issueAPI, configAPI, getImageUrl } from '../services/api';
import { loadGoogleMaps } from '../services/googleMapsLoader';
import { searchLocations, resolveLocationDetails } from '../services/mapSearchEngine';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/common/StatusBadge';

// Quick Jump Cities / Regions
const REGION_PRESETS = [
  { id: 'all', name: '🌍 Global View', lat: 20.5937, lng: 78.9629, zoom: 4 },
  { id: 'hyd', name: 'Hyderabad', lat: 17.385, lng: 78.4867, zoom: 13 },
  { id: 'blr', name: 'Bengaluru', lat: 12.9716, lng: 77.5946, zoom: 13 },
  { id: 'del', name: 'Delhi NCR', lat: 28.6139, lng: 77.209, zoom: 13 },
  { id: 'mum', name: 'Mumbai', lat: 19.076, lng: 72.8777, zoom: 13 },
  { id: 'chn', name: 'Chennai', lat: 13.0827, lng: 80.2707, zoom: 13 },
  { id: 'kol', name: 'Kolkata', lat: 22.5726, lng: 88.3639, zoom: 13 },
  { id: 'pun', name: 'Pune', lat: 18.5204, lng: 73.8567, zoom: 13 },
];

export default function PublicCivicMapPage() {
  const [issues, setIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeIssue, setActiveIssue] = useState(null);
  const [loading, setLoading] = useState(true);

  // Multi-Provider Map & Issue Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const mapContainerRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const dropdownListRef = useRef(null);

  // 1. Fetch Categories Catalog
  useEffect(() => {
    async function loadCatalogs() {
      try {
        const catsRes = await configAPI.getCategories();
        if (catsRes.data) setCategories(catsRes.data);
      } catch (err) {
        console.error('Failed to load map categories', err);
      }
    }
    loadCatalogs();
  }, []);

  // 2. Fetch Map Issues
  const fetchMapIssues = useCallback(async () => {
    setLoading(true);
    try {
      const res = await issueAPI.getPublicMap({
        category: selectedCategory,
        status: selectedStatus,
      });
      if (res.data?.issues) {
        setIssues(res.data.issues);
      }
    } catch (err) {
      console.error('Failed to retrieve public map issues', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedStatus]);

  useEffect(() => {
    fetchMapIssues();
  }, [fetchMapIssues]);

  // Helper to open issue marker info window
  const openIssueInfoWindow = useCallback((issue, marker) => {
    setActiveIssue(issue);
    const contentString = `
      <div style="padding: 8px; max-width: 270px; font-family: sans-serif; color: #0f172a;">
        <div style="font-size: 11px; font-weight: bold; color: #2563eb; margin-bottom: 2px;">
          ${issue.issueNumber || 'ISSUE'}
        </div>
        <div style="font-size: 13px; font-weight: bold; line-height: 1.3; margin-bottom: 4px;">
          ${issue.title}
        </div>
        <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
          ${issue.location?.address || 'Location Tagged'}
        </div>
        <a href="/issues/${issue.issueNumber || issue._id}" style="display: inline-block; font-size: 11px; font-weight: bold; color: #2563eb; text-decoration: underline;">
          View Details →
        </a>
      </div>
    `;

    if (infoWindowRef.current && googleMapRef.current) {
      infoWindowRef.current.setContent(contentString);
      infoWindowRef.current.open(googleMapRef.current, marker);
    }
  }, []);

  // 3. Initialize Google Map Canvas
  useEffect(() => {
    let isMounted = true;

    loadGoogleMaps()
      .then((maps) => {
        if (!isMounted || !mapContainerRef.current) return;

        if (!googleMapRef.current) {
          const map = new maps.Map(mapContainerRef.current, {
            center: { lat: 20.5937, lng: 78.9629 },
            zoom: 5,
            mapTypeId: maps.MapTypeId.ROADMAP,
            mapTypeControl: true,
            mapTypeControlOptions: {
              style: maps.MapTypeControlStyle.HORIZONTAL_BAR,
              position: maps.ControlPosition.TOP_RIGHT,
            },
            fullscreenControl: true,
            streetViewControl: true,
            streetViewControlOptions: {
              position: maps.ControlPosition.RIGHT_BOTTOM,
            },
            zoomControl: true,
            zoomControlOptions: {
              position: maps.ControlPosition.RIGHT_CENTER,
            },
            styles: [
              {
                featureType: 'poi.business',
                stylers: [{ visibility: 'simplified' }],
              },
            ],
          });

          googleMapRef.current = map;
          infoWindowRef.current = new maps.InfoWindow();
        }
      })
      .catch((err) => {
        console.error('[Google Maps Init Error]:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 4. Render Markers on Google Map when issues change
  useEffect(() => {
    if (!googleMapRef.current || !window.google || !window.google.maps) return;
    const maps = window.google.maps;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new maps.LatLngBounds();
    let validMarkerCount = 0;

    issues.forEach((issue) => {
      const [lng, lat] = issue.location?.coordinates || [];
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;

      const position = { lat, lng };
      bounds.extend(position);
      validMarkerCount++;

      // Color based on status
      let pinColor = '#2563EB'; // Blue (submitted)
      if (['in_progress', 'assigned'].includes(issue.status)) pinColor = '#D97706'; // Amber
      if (['resolved_verification_pending', 'closed', 'resolved_confirmed'].includes(issue.status)) pinColor = '#16A34A'; // Green

      // Custom Pin Marker
      const marker = new maps.Marker({
        position,
        map: googleMapRef.current,
        title: issue.title,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: pinColor,
          fillOpacity: 1.0,
          strokeColor: '#FFFFFF',
          strokeWeight: 2.5,
        },
      });

      marker.issueId = issue._id;
      marker.issueNumber = issue.issueNumber;

      marker.addListener('click', () => {
        openIssueInfoWindow(issue, marker);
      });

      markersRef.current.push(marker);
    });

    // Auto-fit bounds if we have markers
    if (validMarkerCount > 1) {
      googleMapRef.current.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    } else if (validMarkerCount === 1) {
      const [lng, lat] = issues[0].location.coordinates;
      googleMapRef.current.setCenter({ lat, lng });
      googleMapRef.current.setZoom(14);
    }
  }, [issues, openIssueInfoWindow]);

  // Multi-Provider Search: Places, Addresses, Landmarks, PIN Codes & Live Civic Tickets
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    setActiveIndex(-1);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (q.trim().length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const center = googleMapRef.current?.getCenter();
        const biasLat = center ? center.lat() : 20.5937;
        const biasLng = center ? center.lng() : 78.9629;

        const results = await searchLocations(q, {
          biasLat,
          biasLng,
          issues, // Search within existing loaded tickets too!
        });

        setSearchResults(results || []);
        setShowSearchDropdown(true);
      } catch (err) {
        console.warn('Map & issue search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 220);
  };

  // Select result: If Issue ticket, open popup; if place, pan & zoom map
  const handleSelectSearchResult = async (item) => {
    setShowSearchDropdown(false);
    setSearchQuery(item.title || '');
    setActiveIndex(-1);

    if (!googleMapRef.current) return;

    try {
      // If it's a civic ticket match
      if (item.source === 'ticket' && item.issueData) {
        const targetIssue = item.issueData;
        const [lng, lat] = targetIssue.location?.coordinates || [item.lng, item.lat];
        if (typeof lat === 'number' && typeof lng === 'number' && (lat !== 0 || lng !== 0)) {
          googleMapRef.current.setCenter({ lat, lng });
          googleMapRef.current.setZoom(16);

          const matchingMarker = markersRef.current.find(
            (m) => m.issueId === targetIssue._id || m.issueNumber === targetIssue.issueNumber
          );
          if (matchingMarker) {
            openIssueInfoWindow(targetIssue, matchingMarker);
          } else {
            setActiveIssue(targetIssue);
          }
        }
        return;
      }

      // If it's a place / address / coordinate
      const details = await resolveLocationDetails(item);
      if (details.lat && details.lng) {
        googleMapRef.current.setCenter({ lat: details.lat, lng: details.lng });
        googleMapRef.current.setZoom(15);
      }
    } catch (err) {
      console.error('Failed to resolve search result details', err);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSearchDropdown || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < searchResults.length) {
        handleSelectSearchResult(searchResults[activeIndex]);
      } else if (searchResults.length > 0) {
        handleSelectSearchResult(searchResults[0]);
      }
    } else if (e.key === 'Escape') {
      setShowSearchDropdown(false);
      setActiveIndex(-1);
    }
  };

  // Auto scroll dropdown to highlighted item
  useEffect(() => {
    if (activeIndex >= 0 && dropdownListRef.current) {
      const items = dropdownListRef.current.querySelectorAll('.search-item');
      if (items[activeIndex]) {
        items[activeIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalCount = issues.length;
  const activeCount = issues.filter((i) => !['closed', 'resolved_confirmed'].includes(i.status)).length;
  const resolvedCount = issues.filter((i) => ['closed', 'resolved_confirmed'].includes(i.status)).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-forest-900 via-forest-800 to-charcoal-900 p-6 md:p-8 rounded-[2.5rem] text-sand-50 shadow-clay-lg relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sage-400/20 border border-sage-300/30 text-sage-200 text-xs font-semibold backdrop-blur-md">
            <Globe2 className="w-3.5 h-3.5 text-sage-300" />
            <span>Interactive Civic Geolocation Explorer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-sand-50 tracking-tight">
            Live Civic Issues Map
          </h1>
          <p className="text-xs sm:text-sm text-sand-200 max-w-2xl leading-relaxed">
            Explore and track real-time reported civic issues across towns, villages, colleges, and municipal zones with verified location telemetry.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3">
          <Link to="/report">
            <button type="button" className="clay-btn-primary px-5 py-2.5 inline-flex items-center gap-2">
              <FilePlus2 className="w-4 h-4" />
              Report Issue
            </button>
          </Link>
          <button
            type="button"
            onClick={fetchMapIssues}
            disabled={loading}
            className="clay-btn-secondary px-5 py-2.5 inline-flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Control Panel: High-Precision Search + Status + Category Filters */}
      <div className="clay-card p-5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          {/* Multi-Provider Autocomplete Search Bar */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-lg">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchDropdown(true);
                }}
                placeholder="Search villages, colleges, ticket # (CIVIC-...), landmarks, coordinates..."
                className="clay-input w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm text-charcoal-900 placeholder-charcoal-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowSearchDropdown(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {isSearching && (
                <RefreshCw className="w-3.5 h-3.5 animate-spin absolute right-8 top-1/2 -translate-y-1/2 text-forest-700" />
              )}
            </div>

            {/* Spatial & Ticket Search Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div
                ref={dropdownListRef}
                className="absolute left-0 right-0 top-full mt-1.5 bg-white/95 backdrop-blur-md rounded-2xl border border-sand-300 shadow-clay-lg z-50 max-h-72 overflow-y-auto divide-y divide-sand-200"
              >
                <div className="px-3.5 py-2 bg-sand-50/90 text-[10px] font-semibold text-charcoal-500 flex items-center justify-between">
                  <span>Matches Found ({searchResults.length})</span>
                  <span className="text-forest-800 flex items-center gap-1 font-bold">
                    <MapPin className="w-3 h-3" /> Villages & Colleges Optimized
                  </span>
                </div>
                {searchResults.map((result, idx) => {
                  const isSelected = activeIndex === idx;
                  const isTicket = result.source === 'ticket';
                  const isCoords = result.source === 'coords';
                  const isGoogle = result.source === 'google';
                  const isCollege = result.type === 'college' || result.title?.toLowerCase().includes('institute') || result.title?.toLowerCase().includes('college');
                  const isVillage = result.type === 'village' || result.title?.toLowerCase().includes('village') || result.title?.toLowerCase().includes('panchayat');

                  return (
                    <button
                      key={result.id || idx}
                      type="button"
                      onClick={() => handleSelectSearchResult(result)}
                      className={`search-item w-full text-left px-3.5 py-2.5 transition flex items-start gap-2.5 text-xs group ${
                        isSelected ? 'bg-sage-100/90 ring-1 ring-inset ring-sage-300' : 'hover:bg-sand-50'
                      }`}
                    >
                      {isTicket ? (
                        <Tag className="w-4 h-4 text-amber-700 group-hover:scale-110 transition mt-0.5 shrink-0" />
                      ) : isCoords ? (
                        <MapPin className="w-4 h-4 text-forest-700 group-hover:scale-110 transition mt-0.5 shrink-0" />
                      ) : isCollege ? (
                        <MapPin className="w-4 h-4 text-forest-800 group-hover:scale-110 transition mt-0.5 shrink-0" />
                      ) : isVillage ? (
                        <MapPin className="w-4 h-4 text-forest-600 group-hover:scale-110 transition mt-0.5 shrink-0" />
                      ) : (
                        <MapPin className="w-4 h-4 text-forest-700 group-hover:scale-110 transition mt-0.5 shrink-0" />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`font-semibold truncate ${isTicket ? 'text-forest-900 font-bold' : 'text-charcoal-900'}`}>
                            {result.title}
                          </span>
                          <span
                            className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                              isTicket
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : isCollege
                                ? 'bg-sage-200 text-forest-900 border border-sage-400'
                                : isVillage
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : isGoogle
                                ? 'bg-sage-100 text-forest-800 border border-sage-300'
                                : isCoords
                                ? 'bg-sage-100 text-forest-800 border border-sage-300'
                                : 'bg-sand-100 text-charcoal-700 border border-sand-300'
                            }`}
                          >
                            {isTicket
                              ? 'Issue Ticket'
                              : isCollege
                              ? 'College / Campus'
                              : isVillage
                              ? 'Village / Gram'
                              : isGoogle
                              ? 'Google Places'
                              : isCoords
                              ? 'GPS Coords'
                              : 'OSM'}
                          </span>
                        </div>
                        <div className="text-[11px] text-charcoal-600 truncate mt-0.5">
                          {result.subtitle || result.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick City Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-charcoal-400 font-semibold text-[10px] uppercase tracking-wider mr-1 shrink-0">
              Jump To:
            </span>
            {REGION_PRESETS.map((reg) => (
              <button
                key={reg.id}
                type="button"
                onClick={() => {
                  if (googleMapRef.current) {
                    googleMapRef.current.setCenter({ lat: reg.lat, lng: reg.lng });
                    googleMapRef.current.setZoom(reg.zoom);
                  }
                }}
                className="clay-pill px-3 py-1 bg-sand-100/90 hover:bg-sand-200 text-charcoal-700 font-medium whitespace-nowrap transition text-xs shrink-0 cursor-pointer"
              >
                {reg.name}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Badges & Categories */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-3 border-t border-sand-200">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-sand-100 p-1 rounded-2xl text-xs shadow-inner">
            {[
              { label: `All (${totalCount})`, value: 'all' },
              { label: `Active (${activeCount})`, value: 'active' },
              { label: `Resolved (${resolvedCount})`, value: 'resolved' },
            ].map((st) => (
              <button
                key={st.value}
                onClick={() => setSelectedStatus(st.value)}
                className={`px-3 py-1.5 rounded-xl transition font-semibold ${
                  selectedStatus === st.value
                    ? 'bg-white text-forest-900 shadow-soft font-bold'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`clay-pill px-3.5 py-1.5 transition font-semibold cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-forest-800 text-sand-50 border-forest-800 shadow-soft'
                  : 'bg-white text-charcoal-700 hover:text-charcoal-900 border-sand-300'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                onClick={() => setSelectedCategory(c._id)}
                className={`clay-pill px-3.5 py-1.5 whitespace-nowrap transition font-semibold cursor-pointer ${
                  selectedCategory === c._id
                    ? 'bg-forest-800 text-sand-50 border-forest-800 shadow-soft'
                    : 'bg-white text-charcoal-700 hover:text-charcoal-900 border-sand-300'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Google Map Canvas and Side Overlay Layout */}
      <div className="relative rounded-[2.5rem] overflow-hidden border border-sand-300 shadow-clay-lg h-[680px] bg-sand-100">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Google Maps Live Badge Overlay */}
        <div className="absolute top-4 left-4 z-10 bg-charcoal-900/85 backdrop-blur-md text-white px-4 py-2 rounded-2xl border border-charcoal-700/80 shadow-clay-md flex items-center gap-2 pointer-events-none text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold">Interactive Civic Map</span>
          <span className="text-sand-300 font-normal">| {issues.length} Verified Issues</span>
        </div>

        {/* Selected Issue Drawer */}
        {activeIssue && (
          <div className="clay-card absolute bottom-4 left-4 right-4 sm:right-auto sm:top-4 sm:bottom-auto sm:w-96 p-5 z-20 space-y-3.5 bg-white/95 backdrop-blur-md border border-sand-300 shadow-clay-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-forest-800 bg-sage-100 px-2.5 py-0.5 rounded-full border border-sage-300">
                  {activeIssue.issueNumber}
                </span>
                <StatusBadge status={activeIssue.status} size="sm" />
              </div>

              <button
                onClick={() => setActiveIssue(null)}
                className="text-charcoal-400 hover:text-charcoal-700 p-1.5 rounded-xl hover:bg-sand-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo Thumbnail if available */}
            {activeIssue.evidence?.length > 0 && (
              <div className="rounded-2xl overflow-hidden aspect-video bg-sand-100 border border-sand-300 shadow-inner">
                <img
                  src={getImageUrl(activeIssue.evidence[0].url)}
                  alt={activeIssue.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div>
              <h3 className="text-base font-bold text-charcoal-900 font-heading leading-snug">
                {activeIssue.title}
              </h3>
              <p className="text-xs text-charcoal-600 mt-1 line-clamp-2 leading-relaxed">
                {activeIssue.description}
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-charcoal-600 pt-2 border-t border-sand-200">
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-forest-700" />
                <span className="font-semibold">{activeIssue.category?.name || 'Civic Infrastructure'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span className="truncate">{activeIssue.location?.address || 'Location Tagged'}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-amber-800 font-bold">
                <ThumbsUp className="w-3.5 h-3.5 text-amber-600" />
                <span>{activeIssue.upvoteCount || 0} upvotes</span>
              </div>

              <Link to={`/issues/${activeIssue.issueNumber || activeIssue._id}`}>
                <button type="button" className="clay-btn-primary px-4 py-1.5 text-xs inline-flex items-center gap-1.5">
                  View Ticket
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
