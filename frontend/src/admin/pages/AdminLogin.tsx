import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminLogin: React.FC = () => {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(username, password);
      if (result.success) {
        navigate('/admin/dashboard');
      } else {
        setError(result.error || 'Login failed.');
        setLoading(false);
      }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-slate-800 to-brand-900 p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white text-xl font-bold">
            H
          </div>
          <div>
            <span className="text-xl font-bold text-white block">Horizon Bank</span>
            <span className="text-xs text-white/60">Admin Portal</span>
          </div>
        </div>
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span className="text-sm font-medium text-red-200">Restricted Access</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Bank Operations<br />Control Center
          </h2>
          <p className="text-white/60 text-lg">
            Manage users, accounts, transactions, and banking operations from one secure dashboard.
          </p>
        </div>
        <p className="text-white/40 text-sm">
          © 2026 Horizon Bank. Authorized personnel only.
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white font-bold">H</div>
              <span className="font-bold text-slate-900">Horizon Bank Admin</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Admin Sign In</h1>
            <p className="text-slate-500 text-sm">Enter your administrator credentials</p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-700 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
            >
              {loading ? <LoadingSpinner label="Signing in" size="sm" tone="light" /> : 'Sign in to Admin'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
