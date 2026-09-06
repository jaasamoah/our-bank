import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import type { ManagedCard } from '../mock/adminData';
import { getAdminCards, updateAdminCard, updateAdminCardFreeze } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

type AdminCardView = ManagedCard & {
  fullNumber: string;
  cvc: string;
  holderName: string;
};

const statusColors: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700',
  Frozen: 'bg-blue-50 text-blue-700',
  Cancelled: 'bg-red-50 text-red-700',
};

const AdminCards: React.FC = () => {
  const [cards, setCards] = useState<AdminCardView[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCard, setEditingCard] = useState<AdminCardView | null>(null);
  const [editForm, setEditForm] = useState({ holderName: '', cardNumber: '', expiry: '', cvc: '' });
  const [saving, setSaving] = useState(false);

  const mapCard = (card: Awaited<ReturnType<typeof getAdminCards>>[number]): AdminCardView => ({
    id: String(card.id),
    userId: String(card.user_id ?? card.account_id),
    userName: card.holder_name,
    holderName: card.holder_name,
    accountId: String(card.account_id),
    number: `•••• ${card.last_four}`,
    fullNumber: card.card_number ?? card.last_four,
    cvc: card.cvc ?? '',
    expiry: card.expiry,
    network: card.network as ManagedCard['network'],
    status: card.frozen ? 'Frozen' : 'Active',
    type: card.account_id === 3 ? 'Credit' : 'Debit',
  });

  useEffect(() => {
    getAdminCards()
      .then((data) => setCards(data.map(mapCard)))
      .catch(() => setError('We could not load cards. Please refresh and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = cards.filter((c) =>
    c.userName.toLowerCase().includes(search.toLowerCase()) ||
    c.number.includes(search)
  );

  const setStatus = async (id: string, status: ManagedCard['status']) => {
    if (status === 'Cancelled') {
      setCards((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
      return;
    }
    try {
      const updated = await updateAdminCardFreeze(Number(id), status === 'Frozen');
      setCards((prev) => prev.map((c) => c.id === id ? { ...c, status: updated.frozen ? 'Frozen' : 'Active' } : c));
    } catch {
      setError('We could not update this card. Please try again.');
    }
  };

  const openEdit = (card: AdminCardView) => {
    setEditingCard(card);
    setEditForm({
      holderName: card.holderName,
      cardNumber: card.fullNumber,
      expiry: card.expiry,
      cvc: card.cvc,
    });
    setError('');
  };

  const saveEdit = async () => {
    if (!editingCard || !editForm.holderName.trim() || !editForm.cardNumber.trim() || !editForm.expiry.trim() || !editForm.cvc.trim()) {
      setError('Complete the card holder, number, expiry, and CVC fields.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await updateAdminCard(Number(editingCard.id), {
        holder_name: editForm.holderName.trim(),
        card_number: editForm.cardNumber.replace(/\s/g, ''),
        expiry: editForm.expiry.trim(),
        cvc: editForm.cvc.trim(),
      });
      setCards((prev) => prev.map((card) => card.id === editingCard.id ? mapCard(updated) : card));
      setEditingCard(null);
    } catch {
      setError('We could not save the card details. Check the number and CVC and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Card Management" subtitle="Manage customer debit and credit cards">
      <div className="space-y-6">
        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <input
          type="text"
          placeholder="Search cards…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 w-full sm:w-72"
        />

        {loading ? <div className="rounded-2xl bg-white p-10"><LoadingSpinner label="Loading cards" /></div> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                   <p className="text-xs opacity-70">{c.holderName || c.userName}</p>
                  <p className="text-xs opacity-70">{c.expiry}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Holder</span>
                  <span className="text-sm font-medium text-slate-900">{c.userName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">CVC</span>
                  <span className="text-sm font-mono text-slate-700">{c.cvc ? '•••' : 'Not set'}</span>
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
                <button onClick={() => openEdit(c)} className="flex-1 rounded-xl py-2 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 transition">Edit details</button>
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
        </div>}
      </div>

      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Edit card details</h2>
            <p className="mt-1 text-sm text-slate-500">{editingCard.userName}</p>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700">Card holder
                <input value={editForm.holderName} onChange={(event) => setEditForm((current) => ({ ...current, holderName: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-brand-500" />
              </label>
              <label className="block text-sm font-medium text-slate-700">Card number
                <input inputMode="numeric" value={editForm.cardNumber} onChange={(event) => setEditForm((current) => ({ ...current, cardNumber: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono font-normal outline-none focus:border-brand-500" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-slate-700">Expiry
                  <input placeholder="MM/YY" value={editForm.expiry} onChange={(event) => setEditForm((current) => ({ ...current, expiry: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-brand-500" />
                </label>
                <label className="block text-sm font-medium text-slate-700">CVC
                  <input inputMode="numeric" value={editForm.cvc} onChange={(event) => setEditForm((current) => ({ ...current, cvc: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-brand-500" />
                </label>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setEditingCard(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={() => void saveEdit()} disabled={saving} className="flex-1 rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCards;
