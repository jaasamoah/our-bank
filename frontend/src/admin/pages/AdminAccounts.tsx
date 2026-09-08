import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { formatCurrency } from '../mock/adminData';
import {
  createAdminAccount,
  deleteAdminAccount,
  getAdminAccounts,
  getAdminUsers,
  updateAdminAccount,
  getApiValidationErrors,
  type ApiAdminAccount,
  type ApiUser,
} from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const statusColors: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700',
  Frozen: 'bg-blue-50 text-blue-700',
  Closed: 'bg-slate-100 text-slate-500',
};

type AccountForm = { userId: string; accountNumber: string; accountType: string; balance: string; currency: string; status: string };
const emptyForm: AccountForm = { userId: '', accountNumber: '', accountType: 'checking', balance: '0', currency: 'USD', status: 'Active' };

const AdminAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<ApiAdminAccount[]>([]);
  const [customers, setCustomers] = useState<Array<ApiUser & { total_balance: number }>>([]);
  const [search, setSearch] = useState('');
  const [editAccount, setEditAccount] = useState<ApiAdminAccount | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getAdminAccounts(), getAdminUsers()])
      .then(([accountData, customerData]) => {
        setAccounts(accountData);
        setCustomers(customerData);
        setForm((current) => ({ ...current, userId: current.userId || String(customerData[0]?.id ?? '') }));
      })
      .catch(() => setError('We could not load accounts. Please refresh and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = accounts.filter((a) =>
    a.user_name.toLowerCase().includes(search.toLowerCase()) ||
    a.account_number.toLowerCase().includes(search.toLowerCase()) ||
    a.account_type.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditAccount(null);
    setForm({ ...emptyForm, userId: String(customers[0]?.id ?? '') });
    setFieldErrors({});
    setError('');
    setShowCreate(true);
  };

  const openEdit = (a: ApiAdminAccount) => {
    setEditAccount(a);
    setForm({
      userId: String(a.user_id),
      accountNumber: a.account_number,
      accountType: a.account_type,
      balance: String(a.balance),
      currency: a.currency,
      status: a.status,
    });
    setFieldErrors({});
    setError('');
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.userId) next.userId = 'Select a customer.';
    if (!form.accountType.trim()) next.accountType = 'Account type is required.';
    if (!form.balance.trim() || Number.isNaN(Number(form.balance))) next.balance = 'Enter a valid balance.';
    if (!form.currency.trim() || form.currency.trim().length < 3) next.currency = 'Use a 3-letter currency code.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setError('');
    try {
      const updated = editAccount
        ? await updateAdminAccount(editAccount.id, {
            account_number: form.accountNumber.trim(),
            account_type: form.accountType.trim(),
            balance: Number(form.balance),
            currency: form.currency.trim().toUpperCase(),
            status: form.status,
          })
        : await createAdminAccount({
            user_id: Number(form.userId),
            account_number: form.accountNumber.trim() || undefined,
            account_type: form.accountType.trim(),
            balance: Number(form.balance),
            currency: form.currency.trim().toUpperCase(),
            status: form.status,
          });
      setAccounts((prev) => editAccount ? prev.map((account) => account.id === updated.id ? updated : account) : [updated, ...prev]);
      setEditAccount(null);
      setShowCreate(false);
      setForm(emptyForm);
    } catch (saveError) {
      const parsed = getApiValidationErrors(saveError);
      setFieldErrors(parsed.fields);
      setError(parsed.form || 'We could not save this account. Check the values and account number.');
    } finally {
      setSaving(false);
    }
  };

  const toggleFreeze = async (id: string) => {
    const account = accounts.find((item) => item.id === Number(id));
    if (!account) return;
    try {
      const updated = await updateAdminAccount(account.id, { status: account.status === 'Active' ? 'Frozen' : 'Active' });
      setAccounts((prev) => prev.map((a) => a.id === account.id ? updated : a));
    } catch {
      setError('We could not update this account. Please try again.');
    }
  };

  const removeAccount = async (account: ApiAdminAccount) => {
    if (!window.confirm(`Delete ${account.account_type} for ${account.user_name}? Linked transactions and cards will also be removed.`)) return;
    try {
      await deleteAdminAccount(account.id);
      setAccounts((prev) => prev.filter((item) => item.id !== account.id));
    } catch {
      setError('We could not delete this account. Please try again.');
    }
  };

  const modalOpen = showCreate || Boolean(editAccount);
  return (
    <AdminLayout title="Account Management" subtitle="Create and manage live customer accounts">
      <div className="space-y-6">
        {error && !modalOpen && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input type="search" placeholder="Search accounts…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:w-72" />
          <div className="text-sm text-slate-500 sm:ml-auto">{filtered.length} accounts</div>
          <button type="button" onClick={openCreate} className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">New account</button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {loading ? <div className="p-10"><LoadingSpinner label="Loading accounts" /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100 bg-slate-50 text-left">
                  {['Account', 'Owner', 'Type', 'Balance', 'Status', 'Actions'].map((heading) => <th key={heading} className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{heading}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((account) => (
                    <tr key={account.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4"><p className="font-mono font-medium text-slate-900">{account.account_number}</p><p className="text-xs text-slate-400">{account.currency}</p></td>
                      <td className="px-6 py-4 text-slate-700">{account.user_name}</td>
                      <td className="px-6 py-4 text-slate-700">{account.account_type}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(account.balance, account.currency)}</td>
                      <td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[account.status] ?? statusColors.Active}`}>{account.status}</span></td>
                      <td className="px-6 py-4"><div className="flex gap-2">
                        <button type="button" onClick={() => openEdit(account)} className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100">Edit</button>
                        <button type="button" onClick={() => void toggleFreeze(String(account.id))} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100">{account.status === 'Active' ? 'Freeze' : 'Activate'}</button>
                        <button type="button" onClick={() => void removeAccount(account)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">Delete</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <p className="p-10 text-center text-sm text-slate-500">No accounts found.</p>}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">{editAccount ? 'Edit account' : 'Create account'}</h2>
            <p className="mt-1 text-sm text-slate-500">{editAccount ? editAccount.user_name : 'The account will be immediately visible in the customer portal.'}</p>
            {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {!editAccount && <label className="text-sm font-medium text-slate-700">Customer
                <select value={form.userId} onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"><option value="">Select customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name}</option>)}</select>
                {fieldErrors.userId && <span className="mt-1 block text-xs text-red-600">{fieldErrors.userId}</span>}
              </label>}
              <label className="text-sm font-medium text-slate-700">Account number <span className="font-normal text-slate-400">(optional on create)</span>
                <input value={form.accountNumber} onChange={(event) => setForm((current) => ({ ...current, accountNumber: event.target.value }))} placeholder="Auto-generate if blank" className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" />
                {fieldErrors.accountNumber && <span className="mt-1 block text-xs text-red-600">{fieldErrors.accountNumber}</span>}
              </label>
              <label className="text-sm font-medium text-slate-700">Account type
                <input value={form.accountType} onChange={(event) => setForm((current) => ({ ...current, accountType: event.target.value }))} placeholder="checking, savings, credit" className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" />
                {fieldErrors.accountType && <span className="mt-1 block text-xs text-red-600">{fieldErrors.accountType}</span>}
              </label>
              <label className="text-sm font-medium text-slate-700">Balance
                <input type="number" step="0.01" value={form.balance} onChange={(event) => setForm((current) => ({ ...current, balance: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" />
                {fieldErrors.balance && <span className="mt-1 block text-xs text-red-600">{fieldErrors.balance}</span>}
              </label>
              <label className="text-sm font-medium text-slate-700">Currency
                <input maxLength={8} value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal uppercase" />
                {fieldErrors.currency && <span className="mt-1 block text-xs text-red-600">{fieldErrors.currency}</span>}
              </label>
              <label className="text-sm font-medium text-slate-700">Status
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"><option>Active</option><option>Frozen</option><option>Closed</option></select>
              </label>
            </div>
            <div className="mt-6 flex gap-3"><button type="button" onClick={() => { setEditAccount(null); setShowCreate(false); setError(''); }} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600">Cancel</button><button type="button" onClick={() => void handleSave()} disabled={saving} className="flex-1 rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : editAccount ? 'Save changes' : 'Create account'}</button></div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAccounts;
