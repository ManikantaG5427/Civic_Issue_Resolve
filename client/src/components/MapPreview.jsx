import React, { useEffect, useRef } from 'react';
import { loadGoogleMaps } from '../services/googleMapsLoader';

export default function MapPreview({
  latitude = 17.385,
  longitude = 78.4867,
  height = '200px',
  zoom = 15,
}) {
  const mapRef = useRef(null);
  const safeLat = typeof latitude === 'number' && Number.isFinite(latitude) ? latitude : (parseFloat(latitude) || 17.385);
  const safeLng = typeof longitude === 'number' && Number.isFinite(longitude) ? longitude : (parseFloat(longitude) || 78.4867);

  useEffect(() => {
    let isMounted = true;

    loadGoogleMaps()
      .then((maps) => {
        if (!isMounted || !mapRef.current) return;

        const map = new maps.Map(mapRef.current, {
          center: { lat: safeLat, lng: safeLng },
          zoom: zoom,
          disableDefaultUI: true,
          gestureHandling: 'none',
          zoomControl: false,
          styles: [
            {
              featureType: 'poi.business',
              stylers: [{ visibility: 'simplified' }],
            },
          ],
        });

        new maps.Marker({
          position: { lat: safeLat, lng: safeLng },
          map: map,
          title: 'Issue Location',
        });
      })
      .catch((err) => {
        console.warn('Map preview fallback:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [safeLat, safeLng, zoom]);

  return (
    <div
      className="rounded-xl overflow-hidden border border-slate-200 shadow-sm relative z-0 bg-slate-100"
      style={{ height }}
    >
      <div ref={mapRef} className="w-full h-full pointer-events-none" />
    </div>
  );
}
