import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Clock, X, AlertCircle } from 'lucide-react';

// 24 Hours in milliseconds (1 day)
const INACTIVITY_TIMEOUT_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'civic_last_activity_time';
const NOTICE_KEY = 'civic_inactivity_notice';

export default function InactivityGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const lastRecordedRef = useRef(0);
  const [showNotice, setShowNotice] = useState(false);

  // Check if notice was requested
  useEffect(() => {
    if (sessionStorage.getItem(NOTICE_KEY) === 'true') {
      setShowNotice(true);
      sessionStorage.removeItem(NOTICE_KEY);
    }
  }, [location.pathname]);

  // Handle redirect if inactive for > 1 day
  const checkAndRedirectIfStale = (isMountOrFocus = false) => {
    const rawTime = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();

    if (!rawTime) {
      localStorage.setItem(STORAGE_KEY, String(now));
      return;
    }

    const lastTime = Number(rawTime);
    if (!isNaN(lastTime) && now - lastTime >= INACTIVITY_TIMEOUT_MS) {
      // If user was on any page other than home, send them to home
      if (location.pathname !== '/') {
        console.warn(
          `[InactivityGuard] User left page inactive for > 24 hours (${Math.round(
            (now - lastTime) / (1000 * 60 * 60)
          )}h). Redirecting to home.`
        );

        localStorage.setItem(STORAGE_KEY, String(now));
        sessionStorage.setItem(NOTICE_KEY, 'true');
        
        // If password reset or other sensitive page, clean up session if needed
        if (location.pathname.startsWith('/reset-password')) {
          sessionStorage.removeItem('reset_page_opened_at');
        }

        navigate('/', { replace: true, state: { inactivityRedirect: true } });
        return true;
      } else {
        // Already on home page, update timestamp
        localStorage.setItem(STORAGE_KEY, String(now));
      }
    } else if (isMountOrFocus) {
      // Recent activity, refresh timestamp
      localStorage.setItem(STORAGE_KEY, String(now));
    }
    return false;
  };

  useEffect(() => {
    // Check on route change
    checkAndRedirectIfStale(true);

    // Throttle user activity recording (record at most once every 10 seconds)
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastRecordedRef.current > 10000) {
        lastRecordedRef.current = now;
        localStorage.setItem(STORAGE_KEY, String(now));
      }
    };

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Visibility & focus handlers (fires when user returns to tab after hours/days)
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkAndRedirectIfStale(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // Periodic check every 30 seconds
    const interval = setInterval(() => {
      checkAndRedirectIfStale(false);
    }, 30000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      clearInterval(interval);
    };
  }, [location.pathname, navigate]);

  if (!showNotice) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="p-4 rounded-2xl bg-amber-500 text-white shadow-xl border border-amber-600 flex items-start gap-3">
        <Clock className="w-5 h-5 shrink-0 mt-0.5 text-amber-100" />
        <div className="flex-1 text-xs sm:text-sm">
          <p className="font-bold">Inactivity Redirect</p>
          <p className="text-amber-100 mt-0.5 text-xs">
            Your previous page session was idle for more than a day (24 hours). You have been safely returned to the Home page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNotice(false)}
          className="p-1 rounded-lg hover:bg-amber-600 text-white transition"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
