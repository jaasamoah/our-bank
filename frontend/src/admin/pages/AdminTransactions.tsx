import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  createAdminTransaction,
  getAdminAccounts,
  getAdminTransactions,
  getAdminUsers,
  updateAdminTransactionStatus,
  type ApiAdminAccount,
  type ApiAdminTransaction,
  type ApiUser,
} from '../../services/api';
import { formatCurrency, formatDate } from '../../mock/data';

const statusStyles: Record<string, string> = {
  processing: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-red-50 text-red-700',
  reversed: 'bg-slate-100 text-slate-600',
};

const statusLabels: Record<string, string> = {
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  reversed: 'Reversed',
};

const statusOptions = ['processing', 'completed', 'failed', 'reversed'];

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
  date: new Date().toISOString().slice(0, 10),
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
      .catch(() => setError('We could not load customers and accounts for new transactions.'));
  }, []);

  const openCreate = () => {
    const firstCustomer = customers[0];
    const firstAccount = accounts.find((account) => account.user_id === firstCustomer?.id);
    setForm({
      ...emptyForm,
      userId: firstCustomer ? String(firstCustomer.id) : '',
      accountId: firstAccount ? String(firstAccount.id) : '',
    });
    setError('');
    setShowCreate(true);
  };

  const handleCreate = async () => {
    const amount = Number(form.amount);
    if (!form.userId || !form.accountId || !form.merchant.trim() || !form.category.trim() || !amount || amount <= 0) {
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
        created_at: `${form.date}T12:00:00`,
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
    setTransactions((current) =>
      current.map((transaction) =>
        transaction.id === transactionId ? { ...transaction, status } : transaction,
      ),
    );
    try {
      const updated = await updateAdminTransactionStatus(transactionId, status);
      setTransactions((current) =>
        current.map((transaction) =>
          transaction.reference === updated.reference ? { ...transaction, status: updated.status } : transaction,
        ),
      );
    } catch {
      setTransactions((current) =>
        current.map((transaction) =>
          transaction.id === transactionId ? { ...transaction, status: previous.status } : transaction,
        ),
      );
      setError('We could not update that transaction status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout title="Transaction Management" subtitle="Review live customer transactions and update their status">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            placeholder="Search description, customer, or reference"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:max-w-md"
          />
          <div className="flex w-full gap-3 sm:w-auto">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:w-48"
            >
              <option value="all">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={openCreate}
              className="shrink-0 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
            >
              New transaction
            </button>
          </div>
        </div>

        {error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {loading ? (
            <div className="p-10">
              <LoadingSpinner label="Loading transactions" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">No transactions match your filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left">
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Transaction</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Account</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{transaction.description}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {transaction.reference} · {transaction.amount >= 0 ? 'Credit' : 'Debit'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{transaction.user_name}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        ···· {transaction.account_number.slice(-4)}
                      </td>
                      <td className={`px-6 py-4 font-semibold ${transaction.amount >= 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {transaction.amount >= 0 ? '+' : ''}
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{formatDate(transaction.created_at)}</td>
                      <td className="px-6 py-4">
                        <select
                          aria-label={`Status for transaction ${transaction.reference}`}
                          value={transaction.status}
                          disabled={updatingId === transaction.id}
                          onChange={(event) => void handleStatusChange(transaction.id, event.target.value)}
                          className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none ${statusStyles[transaction.status] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {statusLabels[status]}
                            </option>
                          ))}
                        </select>
                      </td>
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
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create transaction</h2>
                <p className="mt-1 text-sm text-slate-500">Choose the exact customer account this record belongs to.</p>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} className="text-sm text-slate-400 hover:text-slate-700">
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Customer
                  <select
                    value={form.userId}
                    onChange={(event) => {
                      const userId = event.target.value;
                      const firstAccount = accounts.find((account) => String(account.user_id) === userId);
                      setForm((current) => ({
                        ...current,
                        userId,
                        accountId: firstAccount ? String(firstAccount.id) : '',
                      }));
                    }}
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-brand-500"
                  >
                    <option value="">Select customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>{customer.full_name}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Account
                  <select
                    value={form.accountId}
                    onChange={(event) => setForm((current) => ({ ...current, accountId: event.target.value }))}
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-brand-500"
                    disabled={!form.userId}
                  >
                    <option value="">Select account</option>
                    {availableAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.account_type} ···· {account.account_number.slice(-4)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Description
                  <input
                    value={form.merchant}
                    onChange={(event) => setForm((current) => ({ ...current, merchant: event.target.value }))}
                    placeholder="e.g. Payroll deposit"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-brand-500"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Category
                  <input
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                    placeholder="e.g. Income"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-brand-500"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label className="text-sm font-medium text-slate-700">
                  Amount
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                    placeholder="0.00"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-brand-500"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Direction
                  <select
                    value={form.direction}
                    onChange={(event) => setForm((current) => ({ ...current, direction: event.target.value as TransactionForm['direction'] }))}
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-brand-500"
                  >
                    <option value="debit">Debit</option>
                    <option value="credit">Credit</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Date
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-brand-500"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Status
                  <select
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-brand-500"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{statusLabels[status]}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Reference <span className="font-normal text-slate-400">(optional)</span>
                  <input
                    value={form.reference}
                    onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))}
                    placeholder="Generated if blank"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-brand-500"
                  />
                </label>
              </div>
            </div>

            {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button type="button" onClick={() => void handleCreate()} disabled={creating} className="flex-1 rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60">
                {creating ? 'Creating…' : 'Create transaction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminTransactions;