import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';

const createStaticMarker = () => {
  return L.divIcon({
    className: 'custom-civic-pin-static',
    html: `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full">
        <div class="w-7 h-7 rounded-full bg-teal-500/40 border-2 border-teal-300 flex items-center justify-center shadow-lg shadow-teal-500/50">
          <div class="w-3 h-3 rounded-full bg-teal-400 border-2 border-slate-950"></div>
        </div>
        <div class="absolute -bottom-1 w-2 h-2 rotate-45 bg-teal-400"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
};

export default function MapPreview({
  latitude = 17.4849,
  longitude = 78.3967,
  height = '200px',
  zoom = 15,
}) {
  const position = useMemo(() => [latitude, longitude], [latitude, longitude]);
  const customIcon = useMemo(() => createStaticMarker(), []);

  return (
    <div
      className="rounded-xl overflow-hidden border border-slate-800 shadow-inner relative z-0"
      style={{ height }}
    >
      <MapContainer
        center={position}
        zoom={zoom}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        className="w-full h-full z-0 pointer-events-none"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={customIcon} />
      </MapContainer>
    </div>
  );
}
