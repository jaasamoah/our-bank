import React from 'react';
import {
  BuildingLibraryIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '../components/AdminLayout';
import { managedUsers, managedTransactions, kycRecords, formatCurrency } from '../mock/adminData';

const stats = [
  { label: 'Total Users', value: '6', sub: '+1 this week', icon: UsersIcon, color: 'bg-brand-50 text-brand-700' },
  { label: 'Active Accounts', value: '8', sub: '1 frozen', icon: BuildingLibraryIcon, color: 'bg-emerald-50 text-emerald-700' },
  { label: 'Pending KYC', value: '1', sub: '1 rejected', icon: ChartBarIcon, color: 'bg-amber-50 text-amber-700' },
  { label: 'Active Loans', value: '2', sub: '1 defaulted', icon: ClipboardDocumentListIcon, color: 'bg-red-50 text-red-700' },
];

const AdminDashboard: React.FC = () => {
  const totalBalance = managedUsers.reduce((sum, u) => sum + u.totalBalance, 0);
  const pendingTxns = managedTransactions.filter((t) => t.status === 'Pending').length;
  const failedTxns = managedTransactions.filter((t) => t.status === 'Failed').length;
  const pendingKyc = kycRecords.filter((k) => k.status === 'Pending').length;

  return (
    <AdminLayout title="Dashboard" subtitle="Overview of all banking operations">
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
                  <s.icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm font-medium text-slate-700 mt-1">{s.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
            <p className="text-sm font-medium text-white/70 mb-2">Total Assets Under Management</p>
            <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
            <p className="text-xs text-white/60 mt-2">Across all user accounts</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
            <p className="text-sm font-medium text-slate-500 mb-2">Pending Transactions</p>
            <p className="text-3xl font-bold text-amber-600">{pendingTxns}</p>
            <p className="text-xs text-slate-400 mt-2">Awaiting processing</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
            <p className="text-sm font-medium text-slate-500 mb-2">Failed Transactions</p>
            <p className="text-3xl font-bold text-red-600">{failedTxns}</p>
            <p className="text-xs text-slate-400 mt-2">Require attention</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Recent Transactions</h2>
            <div className="space-y-3">
              {managedTransactions.slice(0, 5).map((txn) => (
                <div key={txn.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{txn.merchant}</p>
                    <p className="text-xs text-slate-400">{txn.userName}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${txn.amount >= 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {txn.amount >= 0 ? '+' : ''}{formatCurrency(txn.amount)}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      txn.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                      txn.status === 'Pending' ? 'bg-amber-50 text-amber-700' :
                      txn.status === 'Failed' ? 'bg-red-50 text-red-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{txn.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">KYC Queue ({pendingKyc} pending)</h2>
            <div className="space-y-3">
              {kycRecords.map((k) => (
                <div key={k.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center text-sm font-semibold text-brand-700">
                      {k.userName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{k.userName}</p>
                      <p className="text-xs text-slate-400">{k.documentType}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    k.status === 'Verified' ? 'bg-emerald-50 text-emerald-700' :
                    k.status === 'Pending' ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'
                  }`}>{k.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
