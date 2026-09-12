import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, LockClosedIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import type { ApiSecurityQuestion } from '../services/api';
import Brand from '../components/Brand';
import LoadingSpinner from '../components/LoadingSpinner';

const clearClientAuthStorage = () => {
  try {
    localStorage.removeItem('access_token');
    localStorage.removeItem('admin_access_token');
    sessionStorage.removeItem('access_token');
  } catch {
    // Gracefully handle environments where storage access is restricted
  }
};

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'credentials' | 'security_questions' | 'otp'>('credentials');
  const [challengeToken, setChallengeToken] = useState('');
  const [questions, setQuestions] = useState<ApiSecurityQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, verifySecurityQuestions, verifyLoginOtp } = useAuth();
  const navigate = useNavigate();

  const handleCredentials = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    clearClientAuthStorage();
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        window.location.assign('/dashboard');
        return;
      }
      if (result.stage && result.challengeToken) {
        setChallengeToken(result.challengeToken);
        setQuestions(result.questions ?? []);
        setStep(result.stage);
      } else {
        setError(result.error ?? 'Invalid email or password.');
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to connect to the authentication service.');
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityQuestions = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await verifySecurityQuestions(
        challengeToken,
        questions.map((question) => ({
          question_id: question.id,
          answer: answers[question.id] ?? '',
        })),
      );

      if (result.success) {
        setStep('otp');
      } else if (result.error && result.error.toLowerCase().includes('already been verified')) {
        setError('');
        setStep('otp');
      } else {
        setError(result.error ?? 'The security answers are incorrect.');
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to verify security questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await verifyLoginOtp(challengeToken, otp);

      if (result.success) {
        // Hard redirect guarantees the token stored in localStorage is loaded by the app shell on iOS
        window.location.assign('/dashboard');
        return;
      }
      setError(result.error ?? 'The verification code is incorrect.');
    } catch (err: any) {
      setError(err?.message || 'Failed to verify OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const restart = () => {
    clearClientAuthStorage();
    setStep('credentials');
    setChallengeToken('');
    setQuestions([]);
    setAnswers({});
    setOtp('');
    setError('');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-blue-50 px-4 py-12">
      <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-200/70 blur-3xl" />
      <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-white blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" aria-label="telosbank home" className="inline-flex">
            <Brand className="text-3xl" />
          </Link>
          <p className="mt-3 text-sm text-slate-500">Banking made clear and personal.</p>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-2xl shadow-blue-950/10 sm:p-9">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <LockClosedIcon className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-[-.04em] text-slate-950">
              {step === 'credentials' ? 'Welcome back' : step === 'security_questions' ? 'Confirm your identity' : 'Enter your verification code'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {step === 'credentials'
                ? 'Sign in to access your telosbank accounts'
                : step === 'security_questions'
                  ? 'Answer your security questions before continuing'
                  : 'We sent a one-time code to your email address'}
            </p>
          </div>

          {step === 'credentials' && (
            <form className="mt-8 space-y-5" onSubmit={handleCredentials}>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
                <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50" placeholder="you@example.com" required />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
                <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50" placeholder="Enter password" required />
              </div>
              {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70">
                {loading ? <LoadingSpinner label="Checking credentials" size="sm" tone="light" /> : 'Continue'}
              </button>
              <div className="text-center">
                <Link to="/reset-password" className="text-sm font-semibold text-blue-700 hover:text-blue-900">Forgot your password?</Link>
              </div>
            </form>
          )}

          {step === 'security_questions' && (
            <form className="mt-8 space-y-5" onSubmit={handleSecurityQuestions}>
              {questions.map((question) => (
                <div key={question.id}>
                  <label htmlFor={`security-question-${question.id}`} className="mb-1.5 block text-sm font-semibold text-slate-700">{question.question}</label>
                  <input id={`security-question-${question.id}`} type="password" autoComplete="off" value={answers[question.id] ?? ''} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50" placeholder="Your answer" required />
                </div>
              ))}
              {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70">
                {loading ? <LoadingSpinner label="Checking answers" size="sm" tone="light" /> : 'Continue'}
              </button>
              <button type="button" onClick={restart} className="w-full text-sm font-semibold text-slate-500 hover:text-slate-700">Use a different account</button>
            </form>
          )}

          {step === 'otp' && (
            <form className="mt-8 space-y-5" onSubmit={handleOtp}>
              <div>
                <label htmlFor="otp" className="mb-1.5 block text-sm font-semibold text-slate-700">6-digit code</label>
                <input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-2xl tracking-[.35em] text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50" placeholder="000000" required />
              </div>
              {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              <button type="submit" disabled={loading || otp.length !== 6} className="flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70">
                {loading ? <LoadingSpinner label="Verifying code" size="sm" tone="light" /> : 'Verify and sign in'}
              </button>
              <button type="button" onClick={restart} className="w-full text-sm font-semibold text-slate-500 hover:text-slate-700">Use a different account</button>
            </form>
          )}

          <div className="mt-8 flex items-start gap-3 rounded-2xl bg-blue-50 p-4">
            <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            <p className="text-xs leading-5 text-slate-600">Your account is protected with security questions and a one-time email verification code.</p>
          </div>
        </div>

        <Link to="/" className="mx-auto mt-6 flex w-fit items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-700">
          <ArrowLeftIcon className="h-4 w-4" /> Back to telosbank
        </Link>
      </div>
    </div>
  );
};

export default Login;