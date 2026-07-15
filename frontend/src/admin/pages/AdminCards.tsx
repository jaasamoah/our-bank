import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { managedCards } from '../mock/adminData';
import type { ManagedCard } from '../mock/adminData';

const statusColors: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700',
  Frozen: 'bg-blue-50 text-blue-700',
  Cancelled: 'bg-red-50 text-red-700',
};

const AdminCards: React.FC = () => {
  const [cards, setCards] = useState<ManagedCard[]>(managedCards);
  const [search, setSearch] = useState('');

  const filtered = cards.filter((c) =>
    c.userName.toLowerCase().includes(search.toLowerCase()) ||
    c.number.includes(search)
  );

  const setStatus = (id: string, status: ManagedCard['status']) => {
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
  };

  return (
    <AdminLayout title="Card Management" subtitle="Manage customer debit and credit cards">
      <div className="space-y-6">
        <input
          type="text"
          placeholder="Search cards…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 w-full sm:w-72"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
              <div className={`rounded-xl p-4 mb-4 bg-gradient-to-br ${
                c.type === 'Credit' ? 'from-slate-700 to-slate-900' : 'from-brand-600 to-brand-800'
              } text-white`}>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-medium opacity-70">Horizon Bank</span>
                  <span className="text-xs font-medium opacity-70">{c.network}</span>
                </div>
                <p className="font-mono text-sm tracking-widest mb-2">{c.number}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs opacity-70">{c.holder || c.userName}</p>
                  <p className="text-xs opacity-70">{c.expiry}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Holder</span>
                  <span className="text-sm font-medium text-slate-900">{c.userName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Type</span>
                  <span className="text-sm text-slate-700">{c.type} • {c.network}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Status</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status]}`}>{c.status}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {c.status !== 'Active' && (
                  <button onClick={() => setStatus(c.id, 'Active')} className="flex-1 rounded-xl py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition">Activate</button>
                )}
                {c.status !== 'Frozen' && c.status !== 'Cancelled' && (
                  <button onClick={() => setStatus(c.id, 'Frozen')} className="flex-1 rounded-xl py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition">Freeze</button>
                )}
                {c.status !== 'Cancelled' && (
                  <button onClick={() => setStatus(c.id, 'Cancelled')} className="flex-1 rounded-xl py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition">Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCards;
