import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Crosshair,
  MapPin,
  RefreshCw,
  AlertCircle,
  Search,
  X,
  Check,
  Sparkles,
  Navigation,
  Compass,
} from 'lucide-react';
import { loadGoogleMaps } from '../services/googleMapsLoader';
import {
  searchLocations,
  resolveLocationDetails,
  reverseGeocodeMulti,
} from '../services/mapSearchEngine';

// Quick Presets for Regions across India
const INDIA_REGIONS = [
  { name: '📍 Live GPS', code: 'GPS' },
  { name: 'Hyderabad', lat: 17.385, lng: 78.4867, zoom: 15 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, zoom: 15 },
  { name: 'Delhi NCR', lat: 28.6139, lng: 77.209, zoom: 15 },
  { name: 'Mumbai', lat: 19.076, lng: 72.8777, zoom: 15 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, zoom: 15 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, zoom: 15 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567, zoom: 15 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, zoom: 15 },
];

export default function LocationPickerMap({
  latitude = 17.385,
  longitude = 78.4867,
  onChange,
  onAddressResolved,
  height = '390px',
}) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  // Search & Geocoding State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResultsDropdown, setShowResultsDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [detectedLandmark, setDetectedLandmark] = useState('');
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const mapContainerRef = useRef(null);
  const googleMapInstanceRef = useRef(null);
  const googleMarkerInstanceRef = useRef(null);
  const searchContainerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const dropdownListRef = useRef(null);

  const safeLat = typeof latitude === 'number' && Number.isFinite(latitude) ? latitude : (parseFloat(latitude) || 17.385);
  const safeLng = typeof longitude === 'number' && Number.isFinite(longitude) ? longitude : (parseFloat(longitude) || 78.4867);

  // Multi-provider Reverse Geocoding (Google Geocoder + OSM Nominatim Fallback)
  const performReverseGeocode = useCallback(
    async (lat, lng) => {
      try {
        setIsReverseGeocoding(true);
        const geoData = await reverseGeocodeMulti(lat, lng);
        if (geoData && geoData.formattedAddress) {
          setResolvedAddress(geoData.formattedAddress);
          setDetectedLandmark(geoData.detectedLandmark || '');
          if (onAddressResolved) {
            onAddressResolved(geoData.formattedAddress, {
              ...geoData,
              lat,
              lng,
            });
          }
        }
      } catch (err) {
        console.warn('[Reverse Geocoder Error]:', err);
        setResolvedAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      } finally {
        setIsReverseGeocoding(false);
      }
    },
    [onAddressResolved]
  );

  // Initialize Google Maps Canvas
  useEffect(() => {
    let isMounted = true;

    loadGoogleMaps()
      .then((maps) => {
        if (!isMounted || !mapContainerRef.current) return;

        const mapOptions = {
          center: { lat: safeLat, lng: safeLng },
          zoom: 16,
          mapTypeId: maps.MapTypeId.ROADMAP,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: maps.ControlPosition.TOP_RIGHT,
          },
          zoomControl: true,
          zoomControlOptions: {
            position: maps.ControlPosition.RIGHT_CENTER,
          },
          streetViewControl: true,
          streetViewControlOptions: {
            position: maps.ControlPosition.RIGHT_BOTTOM,
          },
          fullscreenControl: true,
          styles: [
            {
              featureType: 'poi.business',
              stylers: [{ visibility: 'on' }],
            },
            {
              featureType: 'transit',
              elementType: 'labels.icon',
              stylers: [{ visibility: 'on' }],
            },
          ],
        };

        const map = new maps.Map(mapContainerRef.current, mapOptions);
        googleMapInstanceRef.current = map;

        // Custom Google Pin Marker
        const marker = new maps.Marker({
          position: { lat: safeLat, lng: safeLng },
          map: map,
          draggable: true,
          animation: maps.Animation.DROP,
          title: 'Civic Issue Location (Drag to adjust)',
        });
        googleMarkerInstanceRef.current = marker;

        // Marker Drag Event
        marker.addListener('dragend', (e) => {
          const newLat = parseFloat(e.latLng.lat().toFixed(6));
          const newLng = parseFloat(e.latLng.lng().toFixed(6));
          if (onChange) onChange(newLat, newLng);
          performReverseGeocode(newLat, newLng);
        });

        // Map Click Event
        map.addListener('click', (e) => {
          const newLat = parseFloat(e.latLng.lat().toFixed(6));
          const newLng = parseFloat(e.latLng.lng().toFixed(6));
          marker.setPosition({ lat: newLat, lng: newLng });
          if (onChange) onChange(newLat, newLng);
          performReverseGeocode(newLat, newLng);
        });

        performReverseGeocode(safeLat, safeLng);
      })
      .catch((err) => {
        console.error('[Google Maps Canvas Load Error]:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update marker position when props change
  useEffect(() => {
    if (googleMapInstanceRef.current && googleMarkerInstanceRef.current) {
      const currentPos = googleMarkerInstanceRef.current.getPosition();
      if (!currentPos || Math.abs(currentPos.lat() - safeLat) > 0.0001 || Math.abs(currentPos.lng() - safeLng) > 0.0001) {
        const newLatLng = { lat: safeLat, lng: safeLng };
        googleMarkerInstanceRef.current.setPosition(newLatLng);
        googleMapInstanceRef.current.panTo(newLatLng);
      }
    }
  }, [safeLat, safeLng]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowResultsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live Multi-Provider Search with Debounce & Fallback
  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setActiveIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowResultsDropdown(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await searchLocations(query, {
          biasLat: safeLat,
          biasLng: safeLng,
        });

        setSearchResults(results || []);
        setShowResultsDropdown(true);
      } catch (err) {
        console.warn('Map search query error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 220);
  };

  // Select Search Result & Pan/Zoom Map
  const handleSelectSearchResult = async (result) => {
    setShowResultsDropdown(false);
    setSearchQuery(result.title || '');
    setActiveIndex(-1);

    try {
      setIsReverseGeocoding(true);
      const details = await resolveLocationDetails(result);
      const newLat = parseFloat(details.lat.toFixed(6));
      const newLng = parseFloat(details.lng.toFixed(6));

      if (googleMapInstanceRef.current && googleMarkerInstanceRef.current) {
        googleMapInstanceRef.current.setCenter({ lat: newLat, lng: newLng });
        googleMapInstanceRef.current.setZoom(17);
        googleMarkerInstanceRef.current.setPosition({ lat: newLat, lng: newLng });
      }

      if (onChange) onChange(newLat, newLng);
      setResolvedAddress(details.formattedAddress || result.description);
      setDetectedLandmark(details.detectedLandmark || details.street || result.title);

      if (onAddressResolved) {
        onAddressResolved(details.formattedAddress || result.description, {
          ...details,
          lat: newLat,
          lng: newLng,
        });
      }
    } catch (err) {
      console.warn('Location detail resolution error:', err);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Keyboard navigation inside search dropdown
  const handleKeyDown = (e) => {
    if (!showResultsDropdown || searchResults.length === 0) return;

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
      setShowResultsDropdown(false);
      setActiveIndex(-1);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && dropdownListRef.current) {
      const items = dropdownListRef.current.querySelectorAll('.search-result-item');
      if (items[activeIndex]) {
        items[activeIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  // High-accuracy live GPS location capture
  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('GPS Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);
    setGpsSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));

        if (googleMapInstanceRef.current && googleMarkerInstanceRef.current) {
          googleMapInstanceRef.current.setCenter({ lat, lng });
          googleMapInstanceRef.current.setZoom(17);
          googleMarkerInstanceRef.current.setPosition({ lat, lng });
        }

        if (onChange) onChange(lat, lng);
        performReverseGeocode(lat, lng);
        setGpsSuccess(true);
        setGpsLoading(false);
        setTimeout(() => setGpsSuccess(false), 3000);
      },
      (err) => {
        setGpsLoading(false);
        let msg = 'Could not access device location.';
        if (err.code === 1) msg = 'Location permission denied. Please allow GPS access in your browser.';
        else if (err.code === 2) msg = 'Location position unavailable.';
        else if (err.code === 3) msg = 'Location request timed out.';
        setGpsError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="space-y-3">
      {/* Search Bar & GPS Controls */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search Input with Multi-Provider Autocomplete Engine */}
        <div ref={searchContainerRef} className="relative flex-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (searchResults.length > 0) setShowResultsDropdown(true);
              }}
              placeholder="Search any place, college, village, street, landmark, or coordinates..."
              className="clay-input w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm text-charcoal-900 placeholder-charcoal-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowResultsDropdown(false);
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

          {/* Autocomplete Search Dropdown */}
          {showResultsDropdown && searchResults.length > 0 && (
            <div
              ref={dropdownListRef}
              className="absolute left-0 right-0 top-full mt-1.5 bg-white/95 backdrop-blur-md rounded-2xl border border-sand-300 shadow-clay-lg z-50 max-h-72 overflow-y-auto divide-y divide-sand-200"
            >
              <div className="px-3.5 py-2 bg-sand-50/90 text-[10px] font-semibold text-charcoal-500 flex items-center justify-between">
                <span>Verified Spatial Matches ({searchResults.length})</span>
                <span className="text-forest-800 flex items-center gap-1 font-bold">
                  <Sparkles className="w-3 h-3" /> High-Accuracy Engine
                </span>
              </div>
              {searchResults.map((result, idx) => {
                const isSelected = activeIndex === idx;
                const isCollege = result.type === 'college' || result.title?.toLowerCase().includes('institute') || result.title?.toLowerCase().includes('college');
                const isVillage = result.type === 'village' || result.title?.toLowerCase().includes('village') || result.title?.toLowerCase().includes('panchayat');

                return (
                  <button
                    key={result.id || idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(result)}
                    className={`search-result-item w-full text-left px-3.5 py-2.5 transition flex items-start gap-2.5 text-xs group ${
                      isSelected ? 'bg-sage-100/90 ring-1 ring-inset ring-sage-300' : 'hover:bg-sand-50'
                    }`}
                  >
                    {result.source === 'coords' ? (
                      <Compass className="w-4 h-4 text-forest-700 mt-0.5 shrink-0" />
                    ) : isCollege ? (
                      <MapPin className="w-4 h-4 text-forest-800 group-hover:scale-110 transition mt-0.5 shrink-0" />
                    ) : isVillage ? (
                      <MapPin className="w-4 h-4 text-forest-600 group-hover:scale-110 transition mt-0.5 shrink-0" />
                    ) : (
                      <Navigation className="w-4 h-4 text-forest-700 group-hover:scale-110 transition mt-0.5 shrink-0" />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-charcoal-900 truncate">
                          {result.title}
                        </span>
                        <span
                          className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                            isCollege
                              ? 'bg-sage-200 text-forest-900 border border-sage-400'
                              : isVillage
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : result.source === 'google'
                              ? 'bg-sage-100 text-forest-800 border border-sage-300'
                              : result.source === 'coords'
                              ? 'bg-sage-100 text-forest-800 border border-sage-300'
                              : 'bg-sand-100 text-charcoal-700 border border-sand-300'
                          }`}
                        >
                          {isCollege
                            ? 'College / Campus'
                            : isVillage
                            ? 'Village / Gram'
                            : result.source === 'google'
                            ? 'Google Places'
                            : result.source === 'coords'
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

        {/* Live GPS Button */}
        <button
          type="button"
          onClick={handleUseGPS}
          disabled={gpsLoading}
          className={`clay-pill px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 ${
            gpsSuccess
              ? 'bg-sage-200 text-forest-900 border border-sage-400'
              : 'bg-forest-800 text-sand-50 hover:bg-forest-900 border-forest-800 shadow-soft'
          }`}
        >
          {gpsLoading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : gpsSuccess ? (
            <Check className="w-3.5 h-3.5 text-forest-900" />
          ) : (
            <Crosshair className="w-3.5 h-3.5" />
          )}
          <span>{gpsLoading ? 'Locating...' : gpsSuccess ? 'GPS Locked' : 'Detect Live Location'}</span>
        </button>
      </div>

      {gpsError && (
        <div className="p-3 rounded-2xl bg-terracotta-50 border border-terracotta-200 text-terracotta-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-terracotta-600" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Quick City / Region Preset Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
        <span className="text-charcoal-400 font-semibold uppercase tracking-wider text-[9px] mr-1 shrink-0">Quick Jump:</span>
        {INDIA_REGIONS.map((reg) => (
          <button
            key={reg.name}
            type="button"
            onClick={() => {
              if (reg.code === 'GPS') {
                handleUseGPS();
              } else {
                if (googleMapInstanceRef.current && googleMarkerInstanceRef.current) {
                  googleMapInstanceRef.current.setCenter({ lat: reg.lat, lng: reg.lng });
                  googleMapInstanceRef.current.setZoom(reg.zoom);
                  googleMarkerInstanceRef.current.setPosition({ lat: reg.lat, lng: reg.lng });
                }
                if (onChange) onChange(reg.lat, reg.lng);
                performReverseGeocode(reg.lat, reg.lng);
              }
            }}
            className="clay-pill px-3 py-1 bg-sand-100/90 hover:bg-sand-200 text-charcoal-700 font-medium whitespace-nowrap transition text-xs shrink-0 cursor-pointer"
          >
            {reg.name}
          </button>
        ))}
      </div>

      {/* Interactive Google Map Canvas Box */}
      <div
        className="rounded-3xl overflow-hidden border border-sand-300 shadow-clay-md relative z-0 bg-sand-100"
        style={{ height }}
      >
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Status Badge Overlay */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <div className="bg-charcoal-900/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-charcoal-700/80 shadow-clay-md text-[10px] font-semibold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Interactive Map Active</span>
          </div>
        </div>

        {/* Drag Hint & Address Banner */}
        <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
          <div className="bg-charcoal-900/90 backdrop-blur-md text-white text-[11px] px-4 py-2.5 rounded-2xl shadow-clay-lg flex items-center justify-between gap-2 border border-charcoal-700/80">
            <div className="flex items-center gap-2 truncate">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">
                {isReverseGeocoding
                  ? 'Resolving precise address...'
                  : resolvedAddress || `${safeLat.toFixed(5)}, ${safeLng.toFixed(5)}`}
              </span>
            </div>
            {detectedLandmark && (
              <span className="hidden sm:inline text-[10px] bg-forest-700/60 text-sand-100 px-2.5 py-0.5 rounded-full border border-forest-500/40 whitespace-nowrap">
                {detectedLandmark}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

