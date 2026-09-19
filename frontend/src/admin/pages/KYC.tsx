import React, { useEffect, useState } from 'react';
import {
  CheckIcon,
  ExclamationTriangleIcon,
  FolderOpenIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '../components/AdminLayout';
import { getAdminUsers, updateAdminUser } from '../../services/api';

interface KycViewItem {
  id: number;
  userName: string;
  email: string;
  documentType: string;
  submittedDate: string;
  status: 'Verified' | 'Pending' | 'Rejected';
}

const statusColors: Record<string, string> = {
  Verified: 'bg-emerald-50 text-emerald-700',
  Pending: 'bg-amber-50 text-amber-700',
  Rejected: 'bg-red-50 text-red-700',
};

const AdminKYC: React.FC = () => {
  const [records, setRecords] = useState<KycViewItem[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const loadData = () => {
    getAdminUsers()
      .then((users) => {
        // Exclude administrators so only customer accounts undergo KYC verification
        const customerUsers = users.filter(
          (u) => (u.role || 'customer').toLowerCase() === 'customer'
        );

        const items: KycViewItem[] = customerUsers.map((user) => {
          let status: KycViewItem['status'] = 'Pending';
          const current = (user.kyc_status || '').toLowerCase();
          if (current === 'verified') status = 'Verified';
          else if (current === 'rejected') status = 'Rejected';

          return {
            id: user.id,
            userName: user.full_name || user.username,
            email: user.email,
            documentType: 'Passport / National ID',
            submittedDate: user.created_at,
            status,
          };
        });
        setRecords(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSetStatus = async (userId: number, status: KycViewItem['status']) => {
    setActionLoadingId(userId);
    try {
      await updateAdminUser(userId, { kyc_status: status });
      setRecords((prev) =>
        prev.map((item) => (item.id === userId ? { ...item, status } : item))
      );
    } catch {
      alert('Failed to update KYC status. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = records.filter((k) => {
    if (filter === 'All') return true;
    return k.status === filter;
  });

  const pending = records.filter((k) => k.status === 'Pending').length;

  return (
    <AdminLayout title="KYC Approvals" subtitle="Review and approve customer identity verification">
      <div className="space-y-6">
        {pending > 0 && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-center gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium text-amber-800">
              {pending} KYC submission{pending > 1 ? 's' : ''} pending review
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {['All', 'Pending', 'Verified', 'Rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                filter === s
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
            <p className="mt-3 text-sm text-slate-500">Loading KYC submissions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
            <FolderOpenIcon className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-semibold text-slate-800">No submissions found</h3>
            <p className="mt-1 text-xs text-slate-500">
              There are no verification requests under the &ldquo;{filter}&rdquo; filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filtered.map((k) => {
              const initials = (k.userName || 'U')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((n) => n[0])
                .join('')
                .toUpperCase() || 'U';

              const formattedDate = k.submittedDate
                ? new Date(k.submittedDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Recently';

              return (
                <div
                  key={k.id}
                  className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 transition hover:border-slate-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-brand-100 flex items-center justify-center text-base font-bold text-brand-700 shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{k.userName}</p>
                        <p className="text-xs text-slate-400 truncate">{k.email}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${statusColors[k.status]}`}>
                      {k.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-5">
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Document Type</p>
                      <p className="font-medium text-slate-800">{k.documentType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Submitted</p>
                      <p className="font-medium text-slate-800">{formattedDate}</p>
                    </div>
                  </div>

                  {k.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSetStatus(k.id, 'Verified')}
                        disabled={actionLoadingId === k.id}
                        className="flex-1 rounded-xl py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition disabled:opacity-50"
                      >
                        <CheckIcon className="mr-1 inline h-4 w-4" aria-hidden="true" /> Approve
                      </button>
                      <button
                        onClick={() => handleSetStatus(k.id, 'Rejected')}
                        disabled={actionLoadingId === k.id}
                        className="flex-1 rounded-xl py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition disabled:opacity-50"
                      >
                        <XMarkIcon className="mr-1 inline h-4 w-4" aria-hidden="true" /> Reject
                      </button>
                    </div>
                  )}

                  {k.status === 'Rejected' && (
                    <button
                      onClick={() => handleSetStatus(k.id, 'Pending')}
                      disabled={actionLoadingId === k.id}
                      className="w-full rounded-xl py-2 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition disabled:opacity-50"
                    >
                      Reopen for Review
                    </button>
                  )}

                  {k.status === 'Verified' && (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700">
                      <span>
                        <CheckIcon className="mr-1 inline h-4 w-4" aria-hidden="true" /> Identity Verified
                      </span>
                      <button
                        onClick={() => handleSetStatus(k.id, 'Pending')}
                        disabled={actionLoadingId === k.id}
                        className="text-xs text-slate-500 hover:text-slate-700 underline disabled:opacity-50"
                      >
                        Revert
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminKYC;