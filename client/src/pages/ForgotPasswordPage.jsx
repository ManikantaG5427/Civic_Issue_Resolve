import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { KeyRound, Mail, AlertCircle, CheckCircle2, ArrowLeft, UserPlus } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [isNotRegistered, setIsNotRegistered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsNotRegistered(false);
    setSuccessInfo(null);

    if (!email || !email.trim()) {
      setFormError('Please enter your registered email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authAPI.forgotPassword({ email: email.trim() });
      setSuccessInfo(res.message || 'A password reset link has been dispatched to your email address.');
    } catch (err) {
      const errorMsg = err.message || 'Failed to process password reset request. Please try again.';
      setFormError(errorMsg);
      if (
        errorMsg.toLowerCase().includes('register first') ||
        errorMsg.toLowerCase().includes('no account found') ||
        err.status === 404
      ) {
        setIsNotRegistered(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
            Reset Password
          </h1>
          <p className="text-sm text-slate-600">
            Enter your registered email address to receive a secure password reset link.
          </p>
        </div>

        <Card elevated className="p-6 sm:p-8">
          {formError && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs sm:text-sm space-y-3">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{formError}</p>
                  {isNotRegistered && (
                    <p className="mt-1 text-xs text-red-700">
                      You need to create a new CivicResolve account with this email address before you can sign in.
                    </p>
                  )}
                </div>
              </div>
              {isNotRegistered && (
                <div className="pt-2 border-t border-red-200">
                  <Link
                    to={`/register?email=${encodeURIComponent(email)}`}
                    className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-sm transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register an Account Now</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {successInfo ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-green-800">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Password Reset Link Dispatched</span>
                </div>
                <p className="text-xs text-green-700 leading-relaxed">
                  A secure password reset link has been dispatched to <strong className="font-semibold text-green-900">{email}</strong>. Please check your inbox (and spam folder) within the next hour.
                </p>
              </div>

              <div className="pt-3 text-center space-y-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Registered Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formError) setFormError('');
                  if (isNotRegistered) setIsNotRegistered(false);
                }}
                placeholder="user@example.com"
                icon={Mail}
              />

              <Button
                type="submit"
                size="lg"
                loading={isSubmitting}
                className="w-full mt-2"
              >
                Send Reset Instructions
              </Button>

              <div className="mt-6 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-900 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>

                <Link
                  to="/register"
                  className="font-semibold text-brand-700 hover:text-brand-800 transition"
                >
                  Need an account? Register
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

