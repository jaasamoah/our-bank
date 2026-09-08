import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import type { ManagedCard } from '../mock/adminData';
import {
  createAdminCard,
  deleteAdminCard,
  getAdminAccounts,
  getAdminCards,
  getAdminUsers,
  updateAdminCard,
  updateAdminCardFreeze,
  getApiValidationErrors,
  type ApiAdminAccount,
  type ApiUser,
} from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

type AdminCardView = ManagedCard & {
  fullNumber: string;
  cvc: string;
  holderName: string;
  frozen: boolean;
};
type CardForm = { userId: string; accountId: string; holderName: string; cardNumber: string; expiry: string; cvc: string; network: string; frozen: boolean };
const emptyForm: CardForm = { userId: '', accountId: '', holderName: '', cardNumber: '', expiry: '', cvc: '', network: 'Visa', frozen: false };

const statusColors: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700',
  Frozen: 'bg-blue-50 text-blue-700',
  Cancelled: 'bg-red-50 text-red-700',
};

const AdminCards: React.FC = () => {
  const [cards, setCards] = useState<AdminCardView[]>([]);
  const [customers, setCustomers] = useState<Array<ApiUser & { total_balance: number }>>([]);
  const [accounts, setAccounts] = useState<ApiAdminAccount[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCard, setEditingCard] = useState<AdminCardView | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editForm, setEditForm] = useState<CardForm>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const mapCard = (card: Awaited<ReturnType<typeof getAdminCards>>[number]): AdminCardView => ({
    id: String(card.id),
    userId: String(card.user_id),
    userName: card.user_name,
    holderName: card.holder_name,
    accountId: String(card.account_id),
    number: `•••• ${card.last_four}`,
    fullNumber: card.card_number ?? card.last_four,
    cvc: card.cvc ?? '',
    expiry: card.expiry,
    network: card.network as ManagedCard['network'],
    status: card.frozen ? 'Frozen' : 'Active',
    type: card.account_type.toLowerCase() === 'credit' ? 'Credit' : 'Debit',
    frozen: card.frozen,
  });

  useEffect(() => {
    Promise.all([getAdminCards(), getAdminAccounts(), getAdminUsers()])
      .then(([cardData, accountData, customerData]) => {
        setCards(cardData.map(mapCard));
        setAccounts(accountData);
        setCustomers(customerData);
      })
      .catch(() => setError('We could not load cards. Please refresh and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = cards.filter((c) =>
    c.userName.toLowerCase().includes(search.toLowerCase()) ||
    c.number.includes(search)
  );

  const setStatus = async (id: string, frozen: boolean) => {
    try {
      const updated = await updateAdminCardFreeze(Number(id), frozen);
      setCards((prev) => prev.map((c) => c.id === id ? { ...c, status: updated.frozen ? 'Frozen' : 'Active' } : c));
    } catch {
      setError('We could not update this card. Please try again.');
    }
  };

  const openEdit = (card: AdminCardView) => {
    setEditingCard(card);
    setEditForm({
      userId: card.userId,
      accountId: card.accountId,
      holderName: card.holderName,
      cardNumber: card.fullNumber,
      expiry: card.expiry,
      cvc: card.cvc,
      network: card.network,
      frozen: card.frozen,
    });
    setFieldErrors({});
    setError('');
  };

  const openCreate = () => {
    const firstCustomer = customers[0];
    const firstAccount = accounts.find((account) => account.user_id === firstCustomer?.id);
    setEditingCard(null);
    setEditForm({ ...emptyForm, userId: String(firstCustomer?.id ?? ''), accountId: String(firstAccount?.id ?? '') });
    setFieldErrors({});
    setError('');
    setShowCreate(true);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!editForm.userId) next.userId = 'Select a customer.';
    if (!editForm.accountId) next.accountId = 'Select an account.';
    if (!editForm.holderName.trim()) next.holderName = 'Card holder is required.';
    if (!/^\d{12,19}$/.test(editForm.cardNumber.replace(/\s/g, ''))) next.cardNumber = 'Enter 12 to 19 digits.';
    if (!editForm.expiry.trim()) next.expiry = 'Expiry is required.';
    if (!/^\d{3,4}$/.test(editForm.cvc.trim())) next.cvc = 'CVC must be 3 or 4 digits.';
    if (!editForm.network.trim()) next.network = 'Network is required.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveEdit = async () => {
    if (!validate()) return;
    setSaving(true);
    setError('');
    try {
      const updated = editingCard
        ? await updateAdminCard(Number(editingCard.id), {
            account_id: Number(editForm.accountId),
            holder_name: editForm.holderName.trim(),
            card_number: editForm.cardNumber.replace(/\s/g, ''),
            expiry: editForm.expiry.trim(),
            cvc: editForm.cvc.trim(),
            network: editForm.network.trim(),
            frozen: editForm.frozen,
          })
        : await createAdminCard({
            user_id: Number(editForm.userId),
            account_id: Number(editForm.accountId),
            holder_name: editForm.holderName.trim(),
            card_number: editForm.cardNumber.replace(/\s/g, ''),
            expiry: editForm.expiry.trim(),
            cvc: editForm.cvc.trim(),
            network: editForm.network.trim(),
            frozen: editForm.frozen,
          });
      setCards((prev) => editingCard ? prev.map((card) => card.id === editingCard.id ? mapCard(updated) : card) : [mapCard(updated), ...prev]);
      setEditingCard(null);
      setShowCreate(false);
      setEditForm(emptyForm);
    } catch (saveError) {
      const parsed = getApiValidationErrors(saveError);
      setFieldErrors(parsed.fields);
      setError(parsed.form || 'We could not save the card details. Check the number and CVC and try again.');
    } finally {
      setSaving(false);
    }
  };

  const removeCard = async (card: AdminCardView) => {
    if (!window.confirm(`Delete the card ending in ${card.number.slice(-4)}?`)) return;
    try {
      await deleteAdminCard(Number(card.id));
      setCards((prev) => prev.filter((item) => item.id !== card.id));
    } catch {
      setError('We could not delete this card. Please try again.');
    }
  };

  const availableAccounts = accounts.filter((account) => String(account.user_id) === editForm.userId);

  return (
    <AdminLayout title="Card Management" subtitle="Manage customer debit and credit cards">
      <div className="space-y-6">
        {error && !editingCard && !showCreate && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input type="search" placeholder="Search cards…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:w-72" />
          <button type="button" onClick={openCreate} className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">New card</button>
        </div>

        {loading ? <div className="rounded-2xl bg-white p-10"><LoadingSpinner label="Loading cards" /></div> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
              <div className={`rounded-xl p-4 mb-4 bg-gradient-to-br ${
                c.type === 'Credit' ? 'from-slate-700 to-slate-900' : 'from-brand-600 to-brand-800'
              } text-white`}>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-medium opacity-70">telosbank</span>
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
                  <button onClick={() => void setStatus(c.id, false)} className="flex-1 rounded-xl py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition">Activate</button>
                )}
                {c.status === 'Active' && (
                  <button onClick={() => void setStatus(c.id, true)} className="flex-1 rounded-xl py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition">Freeze</button>
                )}
                <button onClick={() => void removeCard(c)} className="flex-1 rounded-xl py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition">Delete</button>
              </div>
            </div>
          ))}
        </div>}
      </div>

      {(editingCard || showCreate) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">{editingCard ? 'Edit card details' : 'Create card'}</h2>
            <p className="mt-1 text-sm text-slate-500">{editingCard ? editingCard.userName : 'Link this card to a customer account.'}</p>
            {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 space-y-4">
              {!editingCard && <label className="block text-sm font-medium text-slate-700">Customer
                <select value={editForm.userId} onChange={(event) => { const userId = event.target.value; const firstAccount = accounts.find((account) => String(account.user_id) === userId); setEditForm((current) => ({ ...current, userId, accountId: String(firstAccount?.id ?? '') })); }} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"><option value="">Select customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name}</option>)}</select>
                {fieldErrors.userId && <span className="mt-1 block text-xs text-red-600">{fieldErrors.userId}</span>}
              </label>}
              <label className="block text-sm font-medium text-slate-700">Account
                <select value={editForm.accountId} onChange={(event) => setEditForm((current) => ({ ...current, accountId: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"><option value="">Select account</option>{availableAccounts.map((account) => <option key={account.id} value={account.id}>{account.user_name} · {account.account_type} · {account.account_number}</option>)}</select>
                {fieldErrors.accountId && <span className="mt-1 block text-xs text-red-600">{fieldErrors.accountId}</span>}
              </label>
              <label className="block text-sm font-medium text-slate-700">Card holder
                <input value={editForm.holderName} onChange={(event) => setEditForm((current) => ({ ...current, holderName: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-brand-500" />
                {fieldErrors.holderName && <span className="mt-1 block text-xs text-red-600">{fieldErrors.holderName}</span>}
              </label>
              <label className="block text-sm font-medium text-slate-700">Card number
                <input inputMode="numeric" value={editForm.cardNumber} onChange={(event) => setEditForm((current) => ({ ...current, cardNumber: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono font-normal outline-none focus:border-brand-500" />
                {fieldErrors.cardNumber && <span className="mt-1 block text-xs text-red-600">{fieldErrors.cardNumber}</span>}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-slate-700">Expiry
                  <input placeholder="MM/YY" value={editForm.expiry} onChange={(event) => setEditForm((current) => ({ ...current, expiry: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-brand-500" />
                  {fieldErrors.expiry && <span className="mt-1 block text-xs text-red-600">{fieldErrors.expiry}</span>}
                </label>
                <label className="block text-sm font-medium text-slate-700">CVC
                  <input inputMode="numeric" value={editForm.cvc} onChange={(event) => setEditForm((current) => ({ ...current, cvc: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-brand-500" />
                  {fieldErrors.cvc && <span className="mt-1 block text-xs text-red-600">{fieldErrors.cvc}</span>}
                </label>
              </div>
              <label className="block text-sm font-medium text-slate-700">Network
                <input value={editForm.network} onChange={(event) => setEditForm((current) => ({ ...current, network: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" />
                {fieldErrors.network && <span className="mt-1 block text-xs text-red-600">{fieldErrors.network}</span>}
              </label>
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={editForm.frozen} onChange={(event) => setEditForm((current) => ({ ...current, frozen: event.target.checked }))} className="h-4 w-4" />Frozen</label>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => { setEditingCard(null); setShowCreate(false); setError(''); }} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={() => void saveEdit()} disabled={saving} className="flex-1 rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">{saving ? 'Saving…' : editingCard ? 'Save changes' : 'Create card'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCards;
