import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  X,
  Crosshair,
  MapPin,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Compass,
} from 'lucide-react';
import { reverseGeocodeMulti } from '../services/mapSearchEngine';

export default function LiveGpsMapCameraModal({
  isOpen,
  onClose,
  onPhotoCaptured,
}) {
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // rear camera default for field capture
  const [coords, setCoords] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [currentAddress, setCurrentAddress] = useState('Acquiring GPS location...');
  const [detectedLandmark, setDetectedLandmark] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const watchIdRef = useRef(null);

  // 1. Initialize High-Accuracy Live GPS Watcher
  useEffect(() => {
    if (!isOpen) return;

    if (!navigator.geolocation) {
      setCurrentAddress('Geolocation not supported on this browser.');
      setGpsLoading(false);
      return;
    }

    setGpsLoading(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy || 5);
        const altitude = pos.coords.altitude ? Math.round(pos.coords.altitude) : null;

        setCoords({ lat, lng, altitude });
        setGpsAccuracy(accuracy);
        setGpsLoading(false);

        // Reverse-geocode to address
        try {
          const geo = await reverseGeocodeMulti(lat, lng);
          if (geo && geo.formattedAddress) {
            setCurrentAddress(geo.formattedAddress);
            setDetectedLandmark(geo.detectedLandmark || geo.street || '');
          }
        } catch (err) {
          setCurrentAddress(`${lat}, ${lng}`);
        }
      },
      (err) => {
        console.warn('Live GPS watch error:', err);
        setGpsLoading(false);
        if (err.code === 1) {
          setCurrentAddress('Location permission denied. Please enable GPS.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isOpen]);

  // 2. Start Live Video Stream from Device Camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      let errorMsg = 'Could not access device camera.';
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Camera permission denied. Please allow camera access in browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'No camera found on this device.';
      }
      setCameraError(errorMsg);
    }
  }, [facingMode]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, startCamera]);

  // 3. Switch between Front and Rear Camera
  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // 4. Capture Frame & Stamp GPS Watermark
  const capturePhoto = () => {
    if (!videoRef.current || !coords) return;
    setIsCapturing(true);
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Draw the raw camera frame
    ctx.drawImage(video, 0, 0, width, height);

    // Render Authentic GPS Map Camera Overlay Banner at the bottom
    const bannerHeight = Math.max(120, Math.round(height * 0.2));
    const bannerY = height - bannerHeight;

    // Dark Frosted Gradient Banner
    const gradient = ctx.createLinearGradient(0, bannerY, 0, height);
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, bannerY, width, bannerHeight);

    // Accent line
    ctx.fillStyle = '#10B981'; // Emerald GPS accent
    ctx.fillRect(0, bannerY, width, 4);

    // Text details
    const paddingX = Math.round(width * 0.03);
    const textStartY = bannerY + Math.round(bannerHeight * 0.28);
    const fontSizeTitle = Math.max(14, Math.round(height * 0.024));
    const fontSizeBody = Math.max(12, Math.round(height * 0.018));

    // Stamp Header: CivicResolve GPS Map Camera
    ctx.font = `bold ${fontSizeTitle}px sans-serif`;
    ctx.fillStyle = '#34D399';
    ctx.fillText(`📍 CIVICRESOLVE GPS MAP CAMERA`, paddingX, textStartY);

    // Stamp Coordinates & Accuracy
    ctx.font = `bold ${fontSizeBody}px monospace`;
    ctx.fillStyle = '#FFFFFF';
    const coordStr = `LAT: ${coords.lat.toFixed(6)}°  LON: ${coords.lng.toFixed(6)}°  ACCURACY: ±${gpsAccuracy || 5}m`;
    ctx.fillText(coordStr, paddingX, textStartY + fontSizeTitle + 8);

    // Stamp Physical Address (clipped)
    ctx.font = `normal ${fontSizeBody}px sans-serif`;
    ctx.fillStyle = '#E2E8F0';
    const addressToDraw = currentAddress.length > 75 ? `${currentAddress.slice(0, 72)}...` : currentAddress;
    ctx.fillText(`ADDR: ${addressToDraw}`, paddingX, textStartY + (fontSizeTitle + 8) * 2);

    // Timestamp & Watermark Tag (Right-Aligned)
    const now = new Date();
    const timeStr = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    ctx.font = `bold ${fontSizeBody}px sans-serif`;
    ctx.fillStyle = '#FCD34D'; // Amber
    const timeWidth = ctx.measureText(timeStr).width;
    ctx.fillText(timeStr, width - timeWidth - paddingX, textStartY);

    // Convert Canvas to File Blob
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const filename = `GPS_MAP_CAM_${Date.now()}.jpg`;
        const file = new File([blob], filename, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);

        if (onPhotoCaptured) {
          onPhotoCaptured({
            file,
            previewUrl,
            latitude: coords.lat,
            longitude: coords.lng,
            address: currentAddress,
            landmark: detectedLandmark,
            isGpsMapCamera: true,
          });
        }

        setIsCapturing(false);
        onClose();
      },
      'image/jpeg',
      0.92
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-700 flex flex-col max-h-[90vh]">
        {/* Top Header Controls */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/90 text-white z-20 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Live GPS Map Camera
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Android & iOS Geotag Mode
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleCamera}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Flip Camera"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Camera Viewport with HUD Overlay */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[380px] sm:min-h-[440px]">
          {flashEffect && <div className="absolute inset-0 bg-white z-30 animate-ping" />}

          {cameraError ? (
            <div className="p-6 text-center text-rose-300 space-y-3">
              <AlertTriangle className="w-10 h-10 mx-auto text-rose-400" />
              <p className="text-sm font-semibold">{cameraError}</p>
              <button
                type="button"
                onClick={startCamera}
                className="px-5 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider transition"
              >
                Retry Camera
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Target Reticle */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-24 h-24 border-2 border-white/40 rounded-2xl relative">
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30" />
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30" />
                </div>
              </div>

              {/* Live GPS HUD Top Stamp */}
              <div className="absolute top-4 left-4 right-4 pointer-events-none z-10 flex items-center justify-between text-[11px] font-mono font-bold text-white bg-slate-950/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>GPS LOCK {coords ? `(±${gpsAccuracy}m)` : 'SEARCHING...'}</span>
                </div>
                <div className="text-amber-300 font-mono">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>

              {/* Live Address & Coordinates Watermark Preview (Bottom) */}
              <div className="absolute bottom-4 left-4 right-4 pointer-events-none z-10 bg-slate-950/85 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-white text-xs space-y-1">
                <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-emerald-400 font-bold">
                  <span>
                    LAT: {coords ? coords.lat.toFixed(6) : '0.000000'} | LON: {coords ? coords.lng.toFixed(6) : '0.000000'}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[9px] uppercase font-bold">
                    Watermarked
                  </span>
                </div>
                <div className="text-slate-200 text-[11px] truncate flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">{currentAddress}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom Shutter Capture Action Bar */}
        <div className="p-5 bg-slate-900 flex items-center justify-around border-t border-slate-800">
          <div className="text-center text-slate-400 text-[11px]">
            <span className="block font-bold text-white">Watermark Applied</span>
            <span>GPS Coords + Timestamp</span>
          </div>

          {/* Big Shutter Button */}
          <button
            type="button"
            onClick={capturePhoto}
            disabled={!coords || isCapturing}
            className="w-18 h-18 rounded-full p-1 bg-white hover:bg-slate-100 shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="w-14 h-14 rounded-full border-4 border-slate-900 bg-emerald-600 group-hover:bg-emerald-500 flex items-center justify-center text-white shadow-inner">
              {isCapturing ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <Camera className="w-6 h-6" />
              )}
            </div>
          </button>

          <div className="text-center text-slate-400 text-[11px]">
            <span className="block font-bold text-white">High Precision</span>
            <span>Official Evidence</span>
          </div>
        </div>
      </div>
    </div>
  );
}
