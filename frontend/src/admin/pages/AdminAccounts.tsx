import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { managedAccounts, formatCurrency } from '../mock/adminData';
import type { ManagedAccount } from '../mock/adminData';

const statusColors: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700',
  Frozen: 'bg-blue-50 text-blue-700',
  Closed: 'bg-slate-100 text-slate-500',
};

const typeColors: Record<string, string> = {
  Checking: 'bg-brand-50 text-brand-700',
  Savings: 'bg-emerald-50 text-emerald-700',
  Credit: 'bg-purple-50 text-purple-700',
  Loan: 'bg-amber-50 text-amber-700',
  Investment: 'bg-indigo-50 text-indigo-700',
};

const AdminAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<ManagedAccount[]>(managedAccounts);
  const [search, setSearch] = useState('');
  const [editAccount, setEditAccount] = useState<ManagedAccount | null>(null);
  const [balanceInput, setBalanceInput] = useState('');
  const [statusInput, setStatusInput] = useState<ManagedAccount['status']>('Active');

  const filtered = accounts.filter((a) =>
    a.userName.toLowerCase().includes(search.toLowerCase()) ||
    a.number.includes(search) ||
    a.type.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (a: ManagedAccount) => {
    setEditAccount(a);
    setBalanceInput(String(a.balance));
    setStatusInput(a.status);
  };

  const handleSave = () => {
    if (!editAccount) return;
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === editAccount.id
          ? { ...a, balance: parseFloat(balanceInput) || a.balance, status: statusInput }
          : a
      )
    );
    setEditAccount(null);
  };

  const toggleFreeze = (id: string) => {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: a.status === 'Active' ? 'Frozen' : 'Active' } : a
      )
    );
  };

  return (
    <AdminLayout title="Account Management" subtitle="View and edit customer account balances and status">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search accounts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 w-full sm:w-72"
          />
          <div className="text-sm text-slate-500 ml-auto">{filtered.length} accounts</div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Account</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Owner</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Balance</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900 font-mono">{a.number}</p>
                      <p className="text-xs text-slate-400">{a.currency}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{a.userName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[a.type]}`}>{a.type}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(a.balance)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[a.status]}`}>{a.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(a)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 transition">Edit</button>
                        <button
                          onClick={() => toggleFreeze(a.id)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${a.status === 'Active' ? 'text-blue-700 bg-blue-50 hover:bg-blue-100' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}
                        >
                          {a.status === 'Active' ? 'Freeze' : 'Unfreeze'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Edit Account</h2>
            <p className="text-sm text-slate-500 mb-5">{editAccount.userName} — {editAccount.number}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Balance (USD)</label>
                <input
                  type="number"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as ManagedAccount['status'])}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                >
                  <option>Active</option><option>Frozen</option><option>Closed</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditAccount(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handleSave} className="flex-1 rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAccounts;
