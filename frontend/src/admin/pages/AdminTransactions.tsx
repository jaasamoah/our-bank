import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { managedTransactions, managedAccounts, managedUsers, formatCurrency } from '../mock/adminData';
import type { ManagedTransaction } from '../mock/adminData';

const statusColors: Record<string, string> = {
  Completed: 'bg-emerald-50 text-emerald-700',
  Pending: 'bg-amber-50 text-amber-700',
  Failed: 'bg-red-50 text-red-700',
  Reversed: 'bg-slate-100 text-slate-600',
};

const emptyTxn: Omit<ManagedTransaction, 'id'> = {
  userId: '', userName: '', accountId: '', merchant: '', category: '',
  date: new Date().toISOString().slice(0, 10), amount: 0, status: 'Pending', type: 'Debit',
};

const AdminTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<ManagedTransaction[]>(managedTransactions);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editTxn, setEditTxn] = useState<ManagedTransaction | null>(null);
  const [form, setForm] = useState<Omit<ManagedTransaction, 'id'>>(emptyTxn);

  const filtered = transactions.filter((t) => {
    const matchSearch = t.merchant.toLowerCase().includes(search.toLowerCase()) || t.userName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCreate = () => {
    setEditTxn(null);
    setForm({ ...emptyTxn, userId: managedUsers[0].id, userName: managedUsers[0].fullName, accountId: managedAccounts[0].id });
    setShowModal(true);
  };

  const openEdit = (t: ManagedTransaction) => {
    setEditTxn(t);
    setForm({ userId: t.userId, userName: t.userName, accountId: t.accountId, merchant: t.merchant, category: t.category, date: t.date, amount: t.amount, status: t.status, type: t.type });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.merchant) return;
    if (editTxn) {
      setTransactions((prev) => prev.map((t) => t.id === editTxn.id ? { ...editTxn, ...form } : t));
    } else {
      setTransactions((prev) => [{ ...form, id: `txn_new_${Date.now()}` }, ...prev]);
    }
    setShowModal(false);
  };

  const changeStatus = (id: string, status: ManagedTransaction['status']) => {
    setTransactions((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
  };

  return (
    <AdminLayout title="Transaction Management" subtitle="Create, edit, and change transaction statuses">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Search transactions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 w-full sm:w-56"
            />
            {['All', 'Completed', 'Pending', 'Failed', 'Reversed'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-xl px-3 py-2 text-xs font-medium transition ${statusFilter === s ? 'bg-brand-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {s}
              </button>
            ))}
          </div>
          <button onClick={openCreate} className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition shrink-0">
            + New Transaction
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Merchant</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{t.merchant}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{t.userName}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{t.category}</td>
                    <td className={`px-6 py-4 font-semibold ${t.amount >= 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {t.amount >= 0 ? '+' : ''}{formatCurrency(t.amount)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-6 py-4">
                      <select
                        value={t.status}
                        onChange={(e) => changeStatus(t.id, e.target.value as ManagedTransaction['status'])}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium border-0 outline-none cursor-pointer ${statusColors[t.status]}`}
                      >
                        <option>Completed</option><option>Pending</option><option>Failed</option><option>Reversed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => openEdit(t)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 transition">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-5">{editTxn ? 'Edit Transaction' : 'Create Transaction'}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Merchant</label>
                  <input value={form.merchant} onChange={e => setForm(f => ({ ...f, merchant: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                  <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Amount (negative = debit)</label>
                  <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ManagedTransaction['status'] }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500">
                    <option>Completed</option><option>Pending</option><option>Failed</option><option>Reversed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ManagedTransaction['type'] }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500">
                    <option>Debit</option><option>Credit</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handleSave} className="flex-1 rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition">Save</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminTransactions;
