import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import GoogleSignInButton from '../components/common/GoogleSignInButton';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unverified user OTP verification state
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const { login, verifyEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setResendMessage('');

    if (!email || !password) {
      setFormError('Please enter both email and password');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      const errMsg = result.error || 'Invalid credentials. Please try again.';
      setFormError(errMsg);
      if (
        errMsg.toLowerCase().includes('not verified') ||
        errMsg.toLowerCase().includes('verification code')
      ) {
        setNeedsVerification(true);
        setResendCooldown(60);
      }
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setResendMessage('');

    if (!verificationCode || verificationCode.trim().length < 6) {
      setFormError('Please enter the 6-digit verification code');
      return;
    }

    setIsSubmitting(true);
    const result = await verifyEmail(email.trim(), verificationCode.trim());
    setIsSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setFormError(result.error || 'Invalid or expired verification code');
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isResending) return;
    setFormError('');
    setResendMessage('');
    setIsResending(true);

    try {
      const res = await authAPI.resendVerification({ email: email.trim() });
      setResendMessage(res.message || 'A fresh 6-digit code has been sent to your email.');
      setResendCooldown(60);
    } catch (err) {
      setFormError(err.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full space-y-6">
        {!needsVerification ? (
          <>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
                Sign In to Civic<span className="text-brand-700">Resolve</span>
              </h1>
              <p className="text-sm text-slate-600">
                Access your civic reports, dispatches, and municipality dashboard.
              </p>
            </div>

            <Card elevated className="p-6 sm:p-8">
              {formError && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start space-x-3 text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{formError}</p>
                    {needsVerification && (
                      <button
                        type="button"
                        onClick={() => setNeedsVerification(true)}
                        className="mt-2 text-xs font-bold text-brand-700 underline"
                      >
                        Enter 6-digit verification code &rarr;
                      </button>
                    )}
                  </div>
                </div>
              {/* Google Sign In Option */}
              <div className="mb-5 space-y-4">
                <GoogleSignInButton
                  label="Sign In with Google"
                  redirectPath={from}
                  onError={(err) => setFormError(err)}
                />

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[11px] font-semibold tracking-wider uppercase text-slate-400 absolute">
                    Or continue with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="name@example.com"
                  icon={Mail}
                />

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-brand-700 hover:text-brand-800 transition"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (formError) setFormError('');
                      }}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  loading={isSubmitting}
                  className="w-full mt-2"
                >
                  Sign In to Account
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-200 text-center">
                <p className="text-xs text-slate-600">
                  Don't have an account yet?{' '}
                  <Link to="/register" className="text-brand-700 font-bold hover:underline">
                    Register as Citizen
                  </Link>
                </p>
              </div>
            </Card>
          </>
        ) : (
          /* UNVERIFIED EMAIL OTP SCREEN */
          <>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center mx-auto shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
                Verify Email Code
              </h1>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                A 6-digit verification code has been dispatched to <strong className="text-slate-900">{email}</strong>.
              </p>
            </div>

            <Card elevated className="p-6 sm:p-8 space-y-5">
              {formError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start space-x-3 text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="font-semibold">{formError}</p>
                </div>
              )}

              {resendMessage && (
                <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-800 flex items-start space-x-3 text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <p className="font-semibold">{resendMessage}</p>
                </div>
              )}

              <form onSubmit={handleVerifySubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-center text-sm font-semibold text-slate-700">
                    Enter 6-Digit Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    className="w-full text-center tracking-[12px] font-mono text-2xl font-bold py-3 px-4 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-slate-900 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                  />
                  <p className="text-center text-[11px] text-slate-500 mt-2">
                    Valid for 15 minutes. Check spam or junk folders if needed.
                  </p>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  loading={isSubmitting}
                  className="w-full"
                >
                  Verify & Sign In
                </Button>
              </form>

              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setNeedsVerification(false)}
                  className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-900 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || isResending}
                  onClick={handleResendCode}
                  className={`inline-flex items-center gap-1.5 font-bold transition ${
                    resendCooldown > 0
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-brand-700 hover:text-brand-800'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0
                      ? `Resend Code in ${resendCooldown}s`
                      : 'Resend Code'}
                  </span>
                </button>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
