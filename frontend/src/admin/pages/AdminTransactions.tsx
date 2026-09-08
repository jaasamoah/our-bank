import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  createAdminTransaction,
  deleteAdminTransaction,
  getAdminAccounts,
  getAdminTransactions,
  getAdminUsers,
  updateAdminTransaction,
  updateAdminTransactionStatus,
  type ApiAdminAccount,
  type ApiAdminTransaction,
  type ApiUser,
} from '../../services/api';
import { formatCurrency } from '../../mock/data';

const statusStyles: Record<string, string> = {
  processing: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-red-50 text-red-700',
  reversed: 'bg-slate-100 text-slate-600',
  on_hold: 'bg-purple-50 text-purple-700',
};

const statusLabels: Record<string, string> = {
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  reversed: 'Reversed',
  on_hold: 'On hold',
};

const statusOptions = ['processing', 'completed', 'failed', 'reversed', 'on_hold'];
const transactionTypes = ['deposit', 'withdrawal', 'purchase', 'transfer'];

function getDateTimeLocal(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

type TransactionForm = {
  userId: string;
  accountId: string;
  merchant: string;
  category: string;
  amount: string;
  direction: 'debit' | 'credit';
  status: string;
  reference: string;
  date: string;
  useCurrentDateTime: boolean;
};

type EditTransactionForm = {
  userId: string;
  accountId: string;
  amount: string;
  direction: 'debit' | 'credit';
  transactionType: string;
  status: string;
  description: string;
  reference: string;
  date: string;
};

const emptyForm: TransactionForm = {
  userId: '',
  accountId: '',
  merchant: '',
  category: '',
  amount: '',
  direction: 'debit',
  status: 'processing',
  reference: '',
  date: getDateTimeLocal(),
  useCurrentDateTime: true,
};

const AdminTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<ApiAdminTransaction[]>([]);
  const [customers, setCustomers] = useState<Array<ApiUser & { total_balance: number }>>([]);
  const [accounts, setAccounts] = useState<ApiAdminAccount[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<TransactionForm>(emptyForm);
  const [creating, setCreating] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<ApiAdminTransaction | null>(null);
  const [editForm, setEditForm] = useState<EditTransactionForm | null>(null);

  const loadTransactions = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      setTransactions(await getAdminTransactions());
      setError('');
    } catch {
      setError('We could not load transactions. Please refresh and try again.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    void loadTransactions(true);
    const refresh = window.setInterval(() => void loadTransactions(), 10000);
    return () => window.clearInterval(refresh);
  }, []);

  useEffect(() => {
    Promise.all([getAdminUsers(), getAdminAccounts()])
      .then(([customerData, accountData]) => {
        setCustomers(customerData);
        setAccounts(accountData);
      })
      .catch(() => setError('We could not load customers and accounts for transaction editing.'));
  }, []);

  const openCreate = () => {
    const firstCustomer = customers[0];
    const firstAccount = accounts.find((account) => account.user_id === firstCustomer?.id);
    setForm({
      ...emptyForm,
      userId: firstCustomer ? String(firstCustomer.id) : '',
      accountId: firstAccount ? String(firstAccount.id) : '',
      date: getDateTimeLocal(),
    });
    setError('');
    setShowCreate(true);
  };

  const handleCreate = async () => {
    const amount = Number(form.amount);
    if (!form.userId || !form.accountId || !form.merchant.trim() || !form.category.trim() || !amount || amount <= 0 || (!form.useCurrentDateTime && !form.date)) {
      setError('Choose a customer account and complete the transaction details.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const created = await createAdminTransaction({
        user_id: Number(form.userId),
        account_id: Number(form.accountId),
        merchant: form.merchant.trim(),
        category: form.category.trim(),
        amount,
        direction: form.direction,
        status: form.status,
        reference: form.reference.trim() || undefined,
        created_at: form.useCurrentDateTime ? new Date().toISOString() : new Date(form.date).toISOString(),
      });
      setTransactions((current) => [created, ...current]);
      setShowCreate(false);
      setForm(emptyForm);
    } catch {
      setError('We could not create that transaction. Confirm the selected account belongs to the customer.');
    } finally {
      setCreating(false);
    }
  };

  const availableAccounts = accounts.filter((account) => String(account.user_id) === form.userId);
  const availableEditAccounts = accounts.filter((account) => String(account.user_id) === editForm?.userId);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((transaction) => {
      const matchesSearch =
        !query ||
        transaction.description.toLowerCase().includes(query) ||
        transaction.user_name.toLowerCase().includes(query) ||
        transaction.reference.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, transactions]);

  const handleStatusChange = async (transactionId: number, status: string) => {
    const previous = transactions.find((transaction) => transaction.id === transactionId);
    if (!previous || previous.status === status) return;
    setUpdatingId(transactionId);
    setError('');
    try {
      await updateAdminTransactionStatus(transactionId, status);
      await loadTransactions();
    } catch {
      setError('We could not update that transaction status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const openEditor = (transaction: ApiAdminTransaction) => {
    setEditingTransaction(transaction);
    setEditForm({
      userId: String(transaction.user_id),
      accountId: String(transaction.account_id),
      amount: String(Math.abs(transaction.amount)),
      direction: transaction.amount >= 0 ? 'credit' : 'debit',
      transactionType: transaction.transaction_type,
      status: transaction.status,
      description: transaction.description,
      reference: transaction.reference,
      date: getDateTimeLocal(new Date(transaction.created_at)),
    });
    setError('');
  };

  const saveEditor = async () => {
    if (!editingTransaction || !editForm) return;
    const amount = Number(editForm.amount);
    if (!editForm.userId || !editForm.accountId || !amount || amount <= 0 || !editForm.description.trim() || !editForm.reference.trim() || !editForm.date) {
      setError('Complete the transaction details with a valid amount, description, reference, and date.');
      return;
    }
    setUpdatingId(editingTransaction.id);
    setError('');
    try {
      await updateAdminTransaction(editingTransaction.id, {
        user_id: Number(editForm.userId),
        account_id: Number(editForm.accountId),
        amount: editForm.direction === 'credit' ? amount : -amount,
        transaction_type: editForm.transactionType,
        status: editForm.status,
        description: editForm.description.trim(),
        reference: editForm.reference.trim(),
        created_at: new Date(editForm.date).toISOString(),
      });
      setEditingTransaction(null);
      setEditForm(null);
      await loadTransactions();
    } catch {
      setError('We could not save the complete transaction. Please check the account and details.');
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteTransaction = async (transaction: ApiAdminTransaction) => {
    if (!window.confirm(`Delete “${transaction.description}” for ${transaction.user_name}?`)) return;
    setUpdatingId(transaction.id);
    setError('');
    try {
      await deleteAdminTransaction(transaction.id);
      setTransactions((current) => current.filter((item) => item.reference !== transaction.reference));
    } catch {
      setError('We could not delete that transaction. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout title="Transaction Management" subtitle="Review, edit, and remove live customer transactions">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <input type="search" placeholder="Search description, customer, or reference" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:max-w-md" />
          <div className="flex w-full gap-3 sm:w-auto">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 sm:w-48">
              <option value="all">All statuses</option>
              {statusOptions.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
            </select>
            <button type="button" onClick={openCreate} className="shrink-0 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">New transaction</button>
          </div>
        </div>
        {error && !showCreate && !editingTransaction && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {loading ? <div className="p-10"><LoadingSpinner label="Loading transactions" /></div> : filtered.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">No transactions match your filters.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-sm">
                <thead><tr className="border-b border-slate-100 bg-slate-50 text-left">
                  {['Transaction', 'Customer', 'Account', 'Amount', 'Date', 'Status', 'Actions'].map((heading) => <th key={heading} className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{heading}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4"><p className="font-medium text-slate-900">{transaction.description}</p><p className="mt-1 text-xs text-slate-400">{transaction.reference} · {transaction.amount >= 0 ? 'Credit' : 'Debit'}</p></td>
                      <td className="px-6 py-4 text-slate-600">{transaction.user_name}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">···· {transaction.account_number.slice(-4)}</td>
                      <td className={`px-6 py-4 font-semibold ${transaction.amount >= 0 ? 'text-emerald-600' : 'text-slate-900'}`}>{transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{new Date(transaction.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td>
                      <td className="px-6 py-4">
                        <select aria-label={`Status for transaction ${transaction.reference}`} value={transaction.status} disabled={updatingId === transaction.id} onChange={(event) => void handleStatusChange(transaction.id, event.target.value)} className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none ${statusStyles[transaction.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {statusOptions.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-4"><div className="flex gap-2">
                        <button type="button" onClick={() => openEditor(transaction)} className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100">Edit</button>
                        <button type="button" onClick={() => void deleteTransaction(transaction)} disabled={updatingId === transaction.id} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50">Delete</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Create transaction</h2>
            <p className="mt-1 text-sm text-slate-500">Choose the exact customer account this record belongs to.</p>
            {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">Customer<select value={form.userId} onChange={(event) => { const userId = event.target.value; const firstAccount = accounts.find((account) => String(account.user_id) === userId); setForm((current) => ({ ...current, userId, accountId: firstAccount ? String(firstAccount.id) : '' })); }} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"><option value="">Select customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name}</option>)}</select></label>
                <label className="text-sm font-medium text-slate-700">Account<select value={form.accountId} onChange={(event) => setForm((current) => ({ ...current, accountId: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" disabled={!form.userId}><option value="">Select account</option>{availableAccounts.map((account) => <option key={account.id} value={account.id}>{account.account_type} ···· {account.account_number.slice(-4)}</option>)}</select></label>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">Description<input value={form.merchant} onChange={(event) => setForm((current) => ({ ...current, merchant: event.target.value }))} placeholder="e.g. Payroll deposit" className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
                <label className="text-sm font-medium text-slate-700">Category<input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="e.g. Income" className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label className="text-sm font-medium text-slate-700">Amount<input type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
                <label className="text-sm font-medium text-slate-700">Direction<select value={form.direction} onChange={(event) => setForm((current) => ({ ...current, direction: event.target.value as TransactionForm['direction'] }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"><option value="debit">Debit</option><option value="credit">Credit</option></select></label>
                <label className="text-sm font-medium text-slate-700">Status<select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal">{statusOptions.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label>
              </div>
              <label className="text-sm font-medium text-slate-700">Date and time<input type="datetime-local" value={form.date} disabled={form.useCurrentDateTime} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-700"><input type="checkbox" checked={form.useCurrentDateTime} onChange={(event) => setForm((current) => ({ ...current, useCurrentDateTime: event.target.checked, date: event.target.checked ? getDateTimeLocal() : current.date }))} className="h-4 w-4" />Use current date and time</label>
              <label className="text-sm font-medium text-slate-700">Reference <span className="font-normal text-slate-400">(optional)</span><input value={form.reference} onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
            </div>
            <div className="mt-6 flex gap-3"><button type="button" onClick={() => setShowCreate(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600">Cancel</button><button type="button" onClick={() => void handleCreate()} disabled={creating} className="flex-1 rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{creating ? 'Creating…' : 'Create transaction'}</button></div>
          </div>
        </div>
      )}

      {editingTransaction && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Edit transaction</h2>
            <p className="mt-1 text-sm text-slate-500">Changes are saved to the customer portal and account balance.</p>
            {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">Customer<select value={editForm.userId} onChange={(event) => { const userId = event.target.value; const firstAccount = accounts.find((account) => String(account.user_id) === userId); setEditForm((current) => current ? { ...current, userId, accountId: firstAccount ? String(firstAccount.id) : '' } : current); }} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal">{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name}</option>)}</select></label>
                <label className="text-sm font-medium text-slate-700">Account<select value={editForm.accountId} onChange={(event) => setEditForm((current) => current ? { ...current, accountId: event.target.value } : current)} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal">{availableEditAccounts.map((account) => <option key={account.id} value={account.id}>{account.account_type} ···· {account.account_number.slice(-4)}</option>)}</select></label>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label className="text-sm font-medium text-slate-700">Amount<input type="number" min="0.01" step="0.01" value={editForm.amount} onChange={(event) => setEditForm((current) => current ? { ...current, amount: event.target.value } : current)} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
                <label className="text-sm font-medium text-slate-700">Direction<select value={editForm.direction} onChange={(event) => setEditForm((current) => current ? { ...current, direction: event.target.value as EditTransactionForm['direction'] } : current)} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"><option value="debit">Debit</option><option value="credit">Credit</option></select></label>
                <label className="text-sm font-medium text-slate-700">Type<select value={editForm.transactionType} onChange={(event) => setEditForm((current) => current ? { ...current, transactionType: event.target.value } : current)} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal">{transactionTypes.map((type) => <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}</select></label>
              </div>
              <label className="text-sm font-medium text-slate-700">Description<textarea rows={2} value={editForm.description} onChange={(event) => setEditForm((current) => current ? { ...current, description: event.target.value } : current)} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">Reference<input value={editForm.reference} onChange={(event) => setEditForm((current) => current ? { ...current, reference: event.target.value } : current)} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
                <label className="text-sm font-medium text-slate-700">Status<select value={editForm.status} onChange={(event) => setEditForm((current) => current ? { ...current, status: event.target.value } : current)} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal">{statusOptions.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label>
              </div>
              <label className="text-sm font-medium text-slate-700">Date and time<input type="datetime-local" value={editForm.date} onChange={(event) => setEditForm((current) => current ? { ...current, date: event.target.value } : current)} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
            </div>
            <div className="mt-6 flex gap-3"><button type="button" onClick={() => { setEditingTransaction(null); setEditForm(null); }} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600">Cancel</button><button type="button" onClick={() => void saveEditor()} disabled={updatingId === editingTransaction.id} className="flex-1 rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{updatingId === editingTransaction.id ? 'Saving…' : 'Save transaction'}</button></div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminTransactions;