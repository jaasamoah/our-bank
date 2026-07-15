import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { kycRecords } from '../mock/adminData';
import type { KYCRecord } from '../mock/adminData';

const statusColors: Record<string, string> = {
  Verified: 'bg-emerald-50 text-emerald-700',
  Pending: 'bg-amber-50 text-amber-700',
  Rejected: 'bg-red-50 text-red-700',
};

const AdminKYC: React.FC = () => {
  const [records, setRecords] = useState<KYCRecord[]>(kycRecords);
  const [filter, setFilter] = useState('All');

  const filtered = records.filter((k) => filter === 'All' || k.status === filter);

  const setStatus = (id: string, status: KYCRecord['status']) => {
    setRecords((prev) => prev.map((k) => k.id === id ? { ...k, status } : k));
  };

  const pending = records.filter((k) => k.status === 'Pending').length;

  return (
    <AdminLayout title="KYC Approvals" subtitle="Review and approve customer identity verification">
      <div className="space-y-6">
        {pending > 0 && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-center gap-3">
            <span className="text-amber-500 text-xl">⚠️</span>
            <p className="text-sm font-medium text-amber-800">{pending} KYC submission{pending > 1 ? 's' : ''} pending review</p>
          </div>
        )}

        <div className="flex gap-2">
          {['All', 'Pending', 'Verified', 'Rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-xl px-3 py-2 text-xs font-medium transition ${filter === s ? 'bg-brand-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((k) => (
            <div key={k.id} className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-brand-100 flex items-center justify-center text-base font-bold text-brand-700">
                    {k.userName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{k.userName}</p>
                    <p className="text-xs text-slate-400">{k.email}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[k.status]}`}>{k.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-5">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Document Type</p>
                  <p className="font-medium text-slate-800">{k.documentType}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Submitted</p>
                  <p className="font-medium text-slate-800">{new Date(k.submittedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
              {k.status === 'Pending' && (
                <div className="flex gap-2">
                  <button onClick={() => setStatus(k.id, 'Verified')} className="flex-1 rounded-xl py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition">
                    ✓ Approve
                  </button>
                  <button onClick={() => setStatus(k.id, 'Rejected')} className="flex-1 rounded-xl py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition">
                    ✕ Reject
                  </button>
                </div>
              )}
              {k.status === 'Rejected' && (
                <button onClick={() => setStatus(k.id, 'Pending')} className="w-full rounded-xl py-2 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition">
                  Reopen for Review
                </button>
              )}
              {k.status === 'Verified' && (
                <div className="rounded-xl bg-emerald-50 py-2 text-center text-xs font-medium text-emerald-700">
                  ✓ Identity Verified
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminKYC;
