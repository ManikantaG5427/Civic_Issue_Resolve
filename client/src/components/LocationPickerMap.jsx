import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, MapPin, RefreshCw, AlertCircle, Compass, Check } from 'lucide-react';

// Custom modern glowing SVG pin marker icon
const createCustomMarker = () => {
  return L.divIcon({
    className: 'custom-civic-pin',
    html: `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full">
        <div class="w-8 h-8 rounded-full bg-teal-500/30 border-2 border-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/40 animate-pulse">
          <div class="w-3.5 h-3.5 rounded-full bg-teal-400 border-2 border-slate-950"></div>
        </div>
        <div class="absolute -bottom-1 w-2 h-2 rotate-45 bg-teal-400"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

// Component to handle map clicks and move pin
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to programmatically re-center map view
function MapRecenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position && position[0] && position[1]) {
      map.setView(position, map.getZoom(), { animate: true });
    }
  }, [position, map]);
  return null;
}

export default function LocationPickerMap({
  latitude = 17.4849,
  longitude = 78.3967,
  onChange,
  height = '320px',
}) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const markerRef = useRef(null);

  const position = useMemo(() => [latitude, longitude], [latitude, longitude]);
  const customIcon = useMemo(() => createCustomMarker(true), []);

  const handleMarkerDragEnd = () => {
    const marker = markerRef.current;
    if (marker != null) {
      const latLng = marker.getLatLng();
      onChange(parseFloat(latLng.lat.toFixed(6)), parseFloat(latLng.lng.toFixed(6)));
    }
  };

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
        onChange(lat, lng);
        setGpsLoading(false);
        setGpsSuccess(true);
        setTimeout(() => setGpsSuccess(false), 3000);
      },
      (err) => {
        setGpsLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGpsError('Location permission was denied. You can still drop a pin on the map manually.');
            break;
          case err.POSITION_UNAVAILABLE:
            setGpsError('Location information is unavailable.');
            break;
          case err.TIMEOUT:
            setGpsError('GPS request timed out. Please try clicking on the map.');
            break;
          default:
            setGpsError('Could not retrieve GPS location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleResetKukatpally = () => {
    onChange(17.4849, 78.3967);
    setGpsError(null);
  };

  return (
    <div className="space-y-3">
      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-teal-400" />
            Interactive Issue Map Pin
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            (Click map or drag marker to exact incident spot)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUseGPS}
            disabled={gpsLoading}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-medium transition disabled:opacity-50"
          >
            {gpsLoading ? (
              <RefreshCw className="w-3 h-3 animate-spin text-teal-400" />
            ) : gpsSuccess ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Crosshair className="w-3 h-3" />
            )}
            <span>{gpsLoading ? 'Locating...' : gpsSuccess ? 'GPS Acquired' : 'Use My GPS'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetKukatpally}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs transition"
            title="Reset to Pilot Center"
          >
            Reset
          </button>
        </div>
      </div>

      {gpsError && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start space-x-2 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Leaflet Map Container */}
      <div
        className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-inner relative z-0"
        style={{ height }}
      >
        <MapContainer
          center={position}
          zoom={14}
          scrollWheelZoom={false}
          className="w-full h-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler
            onLocationSelect={(lat, lng) =>
              onChange(parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6)))
            }
          />

          <MapRecenter position={position} />

          <Marker
            draggable={true}
            eventHandlers={{ dragend: handleMarkerDragEnd }}
            position={position}
            ref={markerRef}
            icon={customIcon}
          />
        </MapContainer>
      </div>

      {/* Real-time Coordinates Display */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 px-1">
        <div className="flex items-center space-x-4">
          <span>
            Latitude: <strong className="text-slate-200 font-mono">{latitude.toFixed(6)}</strong>
          </span>
          <span>
            Longitude: <strong className="text-slate-200 font-mono">{longitude.toFixed(6)}</strong>
          </span>
        </div>
        <span className="text-teal-400 font-medium">GeoJSON [Lng, Lat] ready</span>
      </div>
    </div>
  );
}
