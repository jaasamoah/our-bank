import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon, CheckCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { confirmPasswordReset, requestPasswordReset } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Brand from '../components/Brand';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [token, setToken] = useState(searchParams.get('token') ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'request' | 'confirm' | 'complete'>(token ? 'confirm' : 'request');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await requestPasswordReset(identifier);
      setMessage(result.message);
      if (result.reset_token) {
        setToken(result.reset_token);
        setStep('confirm');
      }
    } catch {
      setError('We could not start the password reset. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('Your new password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const result = await confirmPasswordReset(token, newPassword);
      setMessage(result.message);
      setStep('complete');
    } catch {
      setError('This reset link is invalid or expired. Request a new one and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center">
          <Brand className="text-2xl" />
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
          {step === 'complete' ? (
            <div className="text-center">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-emerald-500" />
              <h1 className="mt-4 text-2xl font-bold text-slate-900">Password updated</h1>
              <p className="mt-2 text-sm text-slate-500">{message}</p>
              <button onClick={() => navigate('/login')} className="mt-6 w-full rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">Return to sign in</button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><LockClosedIcon className="h-5 w-5" /></div>
                <h1 className="text-2xl font-bold text-slate-900">{step === 'request' ? 'Reset your password' : 'Choose a new password'}</h1>
                <p className="mt-1 text-sm text-slate-500">{step === 'request' ? 'Enter your username or email to continue.' : 'Create a new password for your account.'}</p>
              </div>
              {step === 'request' ? (
                <form onSubmit={submitRequest} className="space-y-5">
                  <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Username or email" required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                  {message && <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">{message}</p>}
                  <button disabled={loading} className="flex w-full items-center justify-center rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
                    {loading ? <LoadingSpinner label="Preparing reset" size="sm" tone="light" /> : 'Continue'}
                  </button>
                </form>
              ) : (
                <form onSubmit={submitReset} className="space-y-5">
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" minLength={8} required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" minLength={8} required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                  {message && <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">{message}</p>}
                  <button disabled={loading} className="flex w-full items-center justify-center rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
                    {loading ? <LoadingSpinner label="Updating password" size="sm" tone="light" /> : 'Update password'}
                  </button>
                </form>
              )}
              {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              <Link to="/login" className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-700"><ArrowLeftIcon className="h-4 w-4" /> Back to sign in</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;