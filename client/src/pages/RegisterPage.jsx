import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import GoogleSignInButton from '../components/common/GoogleSignInButton';
import {
  UserPlus,
  User,
  Mail,
  Lock,
  Phone,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  HardHat,
  Users,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('citizen'); // 'citizen' | 'administrator' | 'field_worker'
  const [showPassword, setShowPassword] = useState(false);

  // Verification Step State
  const [step, setStep] = useState('form'); // 'form' | 'verify' | 'pending_approval'
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  // Resend Cooldown Countdown
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const { register, verifyEmail } = useAuth();
  const navigate = useNavigate();

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFieldErrors([]);

    if (name.trim().length < 2) {
      setFormError('Name must be at least 2 characters long');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    const result = await register(name, email, password, phone, role);
    setIsSubmitting(false);

    if (result.success) {
      setStep('verify');
      setResendCooldown(60);
    } else {
      setFormError(result.error || 'Registration failed');
      if (result.errors) {
        setFieldErrors(result.errors);
      }
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setResendMessage('');

    if (!verificationCode || verificationCode.trim().length < 6) {
      setFormError('Please enter the full 6-digit verification code');
      return;
    }

    setIsSubmitting(true);
    const result = await verifyEmail(email.trim(), verificationCode.trim());
    setIsSubmitting(false);

    if (result.success) {
      if (role === 'administrator' || role === 'field_worker') {
        setStep('pending_approval');
      } else {
        navigate('/dashboard', { replace: true });
      }
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
      setFormError(err.message || 'Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  const roles = [
    {
      id: 'citizen',
      title: 'Citizen',
      description: 'Report municipal defects & track resolution progress in real time.',
      icon: Users,
      badge: 'Immediate Access',
    },
    {
      id: 'administrator',
      title: 'Government Officer / Admin',
      description: 'Review queue triage, department dispatch & SLA oversight.',
      icon: Building2,
      badge: 'Super Admin Verified',
    },
    {
      id: 'field_worker',
      title: 'Field Worker / Lead',
      description: 'Receive repair briefs, manage crew & upload geo-tagged photo proof.',
      icon: HardHat,
      badge: 'Super Admin Verified',
    },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8 px-4">
      <div className="max-w-lg w-full space-y-6">
        {step === 'form' && (
          <>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center mx-auto shadow-sm">
                <UserPlus className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
                Create an Account
              </h1>
              <p className="text-sm text-slate-600">
                Join the CivicResolve resolution network. Choose your role below.
              </p>
            </div>

            <Card elevated className="p-6 sm:p-8">
              {formError && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start space-x-3 text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{formError}</p>
                    {fieldErrors.length > 0 && (
                      <ul className="list-disc list-inside mt-1 text-xs opacity-90">
                        {fieldErrors.map((err, i) => (
                          <li key={i}>{err.message}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* Google Sign In / Registration */}
              <div className="mb-5 space-y-4">
                <GoogleSignInButton
                  label="Sign Up / Register with Google"
                  role={role}
                  redirectPath={role === 'administrator' || role === 'field_worker' ? '/dashboard' : '/dashboard'}
                  onError={(err) => setFormError(err)}
                />

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[11px] font-semibold tracking-wider uppercase text-slate-400 absolute">
                    Or register with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* ROLE SELECTION */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Select Your Role *
                  </label>
                  <div className="space-y-2.5">
                    {roles.map((r) => {
                      const Icon = r.icon;
                      const isSelected = role === r.id;
                      return (
                        <div
                          key={r.id}
                          onClick={() => setRole(r.id)}
                          className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
                            isSelected
                              ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-600/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div
                            className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                              isSelected ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-900">{r.title}</span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  isSelected
                                    ? 'bg-brand-200 text-brand-900 font-bold'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {r.badge}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                              {r.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Input
                  label="Full Name *"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  icon={User}
                />

                <Input
                  label="Email Address *"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  icon={Mail}
                />

                <Input
                  label="Phone Number (Optional)"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  icon={Phone}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Password *
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
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

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  loading={isSubmitting}
                  className="w-full mt-2"
                >
                  Continue to Email Verification
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-200 text-center">
                <p className="text-xs text-slate-600">
                  Already have an account?{' '}
                  <Link to="/login" className="text-brand-700 font-bold hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>
            </Card>
          </>
        )}

        {step === 'verify' && (
          <>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center mx-auto shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
                Verify Your Email
              </h1>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                We have sent a 6-digit verification code to <strong className="text-slate-900">{email}</strong>.
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
                    Code is valid for 15 minutes. Check spam or promotions folder if not found.
                  </p>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  loading={isSubmitting}
                  className="w-full"
                >
                  Verify & Enter CivicResolve
                </Button>
              </form>

              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-900 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Email / Role</span>
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

        {step === 'pending_approval' && (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto border border-amber-300 shadow-sm">
              <Clock className="w-8 h-8 text-amber-800" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-900 bg-amber-200 px-3 py-1 rounded-full">
                Email Verified • Role Pending Approval
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
                Welcome to CivicResolve!
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Your email has been verified. You requested the{' '}
                <strong className="text-slate-900 uppercase">
                  {role === 'administrator' ? 'Municipal Officer / Admin' : 'Field Worker'}
                </strong>{' '}
                role.
              </p>
            </div>

            <Card elevated className="p-6 text-left text-xs sm:text-sm space-y-3 bg-amber-50/70 border-amber-200">
              <p className="font-semibold text-amber-950 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-800" />
                Super Admin Verification Required
              </p>
              <p className="text-amber-900 text-xs leading-relaxed">
                The primary Super Administrator (Manikanta) has received your request. Once your service area/zone and department are assigned, your officer privileges will be unlocked automatically.
              </p>
              <p className="text-xs text-slate-600 pt-2 border-t border-amber-200">
                In the meantime, your citizen portal is active so you can report infrastructure issues and track community resolutions.
              </p>
            </Card>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => navigate('/dashboard', { replace: true })}
                className="w-full sm:w-auto"
                size="lg"
              >
                <span>Continue to Dashboard</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
