import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { KeyRound, Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessInfo(null);

    if (!email) {
      setFormError('Please enter your registered email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authAPI.forgotPassword({ email });
      setSuccessInfo(res.data || { message: res.message });
    } catch (err) {
      setFormError(err.message || 'Failed to process password reset request. Please try again.');
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
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start space-x-3 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {successInfo ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-green-800">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Password Reset Instructions Sent</span>
                </div>
                <p className="text-xs text-green-700 leading-relaxed">
                  If an account exists for <strong className="font-semibold">{email}</strong>, a secure reset link has been dispatched to your email address. Please check your inbox and spam folder.
                </p>
              </div>

              <div className="pt-3 text-center">
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
                onChange={(e) => setEmail(e.target.value)}
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

              <div className="mt-6 pt-5 border-t border-slate-200 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
