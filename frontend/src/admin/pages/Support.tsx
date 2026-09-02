import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getAdminComplaints, type ApiComplaint } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const Support: React.FC = () => {
  const [complaints, setComplaints] = useState<Array<ApiComplaint & { user_id: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminComplaints()
      .then(setComplaints)
      .catch(() => setError('We could not load support requests. Please refresh and try again.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Support requests" subtitle="Review customer complaints and service requests">
      {error && <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {loading ? (
          <div className="p-10"><LoadingSpinner label="Loading support requests" /></div>
        ) : complaints.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">No support requests yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {complaints.map((complaint) => (
              <article key={complaint.id} className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-900">{complaint.subject}</h2>
                    <p className="mt-1 text-xs text-slate-500">Customer #{complaint.user_id} · {new Date(complaint.created_at).toLocaleString()}</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium capitalize text-amber-700">{complaint.status}</span>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{complaint.message}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Support;