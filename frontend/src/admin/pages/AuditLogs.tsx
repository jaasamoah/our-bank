import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { auditLogs } from '../mock/adminData';

const severityColors: Record<string, string> = {
  Info: 'bg-brand-50 text-brand-700',
  Warning: 'bg-amber-50 text-amber-700',
  Critical: 'bg-red-50 text-red-700',
};

const severityDot: Record<string, string> = {
  Info: 'bg-brand-500',
  Warning: 'bg-amber-500',
  Critical: 'bg-red-500',
};

const AdminAuditLogs: React.FC = () => {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = auditLogs.filter((l) => {
    const matchFilter = filter === 'All' || l.severity === filter;
    const matchSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.target.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <AdminLayout title="Audit Logs" subtitle="Complete record of all admin actions">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Search logs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 w-full sm:w-64"
          />
          <div className="flex gap-2">
            {['All', 'Info', 'Warning', 'Critical'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-xl px-3 py-2 text-xs font-medium transition ${filter === s ? 'bg-brand-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {s}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400 sm:ml-auto">{filtered.length} entries</span>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Severity</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Target</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Details</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Admin</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${severityColors[l.severity]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${severityDot[l.severity]}`} />
                        {l.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{l.action}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{l.target}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs max-w-xs">{l.details}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{l.adminName}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAuditLogs;
