import React, { useEffect, useState } from 'react';
import { BuildingLibraryIcon, ChartBarIcon, CreditCardIcon, CurrencyDollarIcon, UsersIcon } from '@heroicons/react/24/outline';
import AdminLayout from '../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getAdminDashboard, type ApiAdminDashboard } from '../../services/api';
import { formatCurrency } from '../mock/adminData';

const AdminDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<ApiAdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async (showLoading = false) => {
      if (showLoading) setLoading(true);
      try {
        const data = await getAdminDashboard();
        if (mounted) {
          setDashboard(data);
          setError('');
        }
      } catch {
        if (mounted) setError('We could not load the live dashboard. Please refresh and try again.');
      } finally {
        if (mounted && showLoading) setLoading(false);
      }
    };
    void load(true);
    const refresh = window.setInterval(() => void load(), 10000);
    return () => {
      mounted = false;
      window.clearInterval(refresh);
    };
  }, []);

  const stats = dashboard ? [
    { label: 'Total Users', value: dashboard.total_users, sub: `${dashboard.active_users} active`, icon: UsersIcon, color: 'bg-brand-50 text-brand-700' },
    { label: 'Active Accounts', value: dashboard.active_accounts, sub: `${dashboard.total_accounts} total`, icon: BuildingLibraryIcon, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Active Cards', value: dashboard.active_cards, sub: `${dashboard.total_cards} total`, icon: CreditCardIcon, color: 'bg-purple-50 text-purple-700' },
    { label: 'Active Loans', value: dashboard.active_loans, sub: 'Current loan records', icon: ChartBarIcon, color: 'bg-amber-50 text-amber-700' },
  ] : [];

  return (
    <AdminLayout title="Dashboard" subtitle="Live overview of customer and banking operations">
      {loading ? <div className="rounded-2xl bg-white p-12 shadow-sm"><LoadingSpinner label="Loading live dashboard" /></div> : dashboard ? (
        <div className="space-y-8">
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <span className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}><stat.icon className="h-5 w-5" aria-hidden="true" /></span>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                <p className="mt-1 text-sm font-medium text-slate-700">{stat.label}</p>
                <p className="mt-0.5 text-xs text-slate-400">{stat.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
              <CurrencyDollarIcon className="mb-4 h-6 w-6 text-white/70" />
              <p className="mb-2 text-sm font-medium text-white/70">Total assets</p>
              <p className="text-3xl font-bold">{formatCurrency(dashboard.total_assets)}</p>
              <p className="mt-2 text-xs text-white/60">Accounts plus investment market value</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <p className="mb-2 text-sm font-medium text-slate-500">Account balances</p>
              <p className="text-3xl font-bold text-slate-900">{formatCurrency(dashboard.total_account_balances)}</p>
              <p className="mt-2 text-xs text-slate-400">Recomputed from live accounts</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <p className="mb-2 text-sm font-medium text-slate-500">Investment value</p>
              <p className="text-3xl font-bold text-indigo-700">{formatCurrency(dashboard.total_investment_value)}</p>
              <p className="mt-2 text-xs text-slate-400">{dashboard.pending_transactions} pending · {dashboard.failed_transactions} failed transactions</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div><h2 className="text-base font-semibold text-slate-900">Recent transactions</h2><p className="mt-1 text-xs text-slate-400">Latest records from customer accounts</p></div>
              <span className="text-xs text-slate-400">Auto-refreshes every 10 seconds</span>
            </div>
            <div className="space-y-3">
              {dashboard.recent_transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0">
                  <div><p className="text-sm font-medium text-slate-900">{transaction.description}</p><p className="text-xs text-slate-400">{transaction.user_name} · {transaction.reference}</p></div>
                  <div className="text-right"><p className={`text-sm font-semibold ${transaction.amount >= 0 ? 'text-emerald-600' : 'text-slate-900'}`}>{transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}</p><p className="text-xs capitalize text-slate-400">{transaction.status.replace('_', ' ')}</p></div>
                </div>
              ))}
              {dashboard.recent_transactions.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No transactions have been recorded.</p>}
            </div>
          </div>
        </div>
      ) : <div className="rounded-2xl bg-red-50 p-8 text-center text-sm text-red-700">{error || 'No dashboard data is available.'}</div>}
    </AdminLayout>
  );
};

export default AdminDashboard;