import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, LockClosedIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import Brand from '../components/Brand';
import LoadingSpinner from '../components/LoadingSpinner';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error ?? 'Something went wrong.');
    }
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
            <h1 className="mt-5 text-2xl font-bold tracking-[-.04em] text-slate-950">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-500">Sign in to access your telosbank accounts</p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-semibold text-slate-700">Username</label>
              <input id="username" type="text" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50" placeholder="Enter username" required />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
              <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50" placeholder="Enter password" required />
            </div>
            {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70">
              {loading ? <LoadingSpinner label="Signing in" size="sm" tone="light" /> : 'Sign in'}
            </button>
            <div className="text-center">
              <Link to="/reset-password" className="text-sm font-semibold text-blue-700 hover:text-blue-900">Forgot your password?</Link>
            </div>
          </form>

          <div className="mt-8 flex items-start gap-3 rounded-2xl bg-blue-50 p-4">
            <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            <p className="text-xs leading-5 text-slate-600">Your account is protected with secure sign in and activity monitoring.</p>
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