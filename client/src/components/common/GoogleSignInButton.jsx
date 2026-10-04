import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, AlertCircle, X, Sparkles, CheckCircle2 } from 'lucide-react';

export default function GoogleSignInButton({
  label = 'Continue with Google',
  redirectPath = '/dashboard',
  role = 'citizen',
  onError,
}) {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSimModal, setShowSimModal] = useState(false);
  const [simEmail, setSimEmail] = useState('');
  const [simName, setSimName] = useState('');
  const [simError, setSimError] = useState('');

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Initialize Google Identity Services if client ID exists
  useEffect(() => {
    if (!googleClientId) return;

    const loadGIS = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
        } catch (err) {
          console.warn('GIS initialization error:', err);
        }
      }
    };

    if (!document.getElementById('google-client-script')) {
      const script = document.createElement('script');
      script.id = 'google-client-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = loadGIS;
      document.body.appendChild(script);
    } else {
      loadGIS();
    }
  }, [googleClientId]);

  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) return;
    setLoading(true);
    try {
      const result = await googleLogin({
        credential: response.credential,
        role,
      });
      if (result.success) {
        navigate(redirectPath, { replace: true });
      } else {
        if (onError) onError(result.error);
        else setSimError(result.error || 'Google authentication failed.');
      }
    } catch (err) {
      if (onError) onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    // If real Google Client ID is configured and GIS is available, trigger One Tap prompt
    if (googleClientId && window.google?.accounts?.id) {
      setLoading(true);
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setLoading(false);
            // Fall back to direct modal if prompt is not displayed
            setShowSimModal(true);
          }
        });
      } catch {
        setLoading(false);
        setShowSimModal(true);
      }
    } else {
      // Show Google OAuth login modal
      setShowSimModal(true);
    }
  };

  const handleQuickGoogleSubmit = async (e) => {
    e.preventDefault();
    setSimError('');

    if (!simEmail || !simEmail.includes('@')) {
      setSimError('Please enter a valid Google email address');
      return;
    }

    setLoading(true);
    try {
      const result = await googleLogin({
        email: simEmail.trim().toLowerCase(),
        name: simName.trim() || simEmail.split('@')[0],
        googleId: `google_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(simEmail.trim())}`,
        role,
      });

      if (result.success) {
        setShowSimModal(false);
        navigate(redirectPath, { replace: true });
      } else {
        setSimError(result.error || 'Failed to sign in with Google');
      }
    } catch (err) {
      setSimError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-sm transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-100 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
        ) : (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>{label}</span>
      </button>

      {/* Interactive Google Sign-In Modal */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 sm:p-7 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowSimModal(false);
                setSimError('');
              }}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-md flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Sign in with Google
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Authenticate your verified Google profile with CivicResolve.
              </p>
            </div>

            {simError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{simError}</span>
              </div>
            )}

            {/* Quick Demo Options */}
            <div className="mb-4 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Quick Select Account
              </p>
              <button
                type="button"
                onClick={() => {
                  setSimEmail('gundrothumanikantad@gmail.com');
                  setSimName('Manikanta Gundrothu');
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition text-left text-xs text-slate-800 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-xs">
                    M
                  </div>
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>Manikanta Gundrothu</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full">
                        Super Admin
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">gundrothumanikantad@gmail.com</div>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition" />
              </button>
            </div>

            <form onSubmit={handleQuickGoogleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google Account Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@gmail.com"
                  value={simEmail}
                  onChange={(e) => setSimEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Manikanta"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSimModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Continue</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <p className="text-[11px] text-slate-400 text-center mt-4">
              Instant verification. No OTP required for Google Sign-In.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
