import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  getAdminTransactions,
  updateAdminTransactionStatus,
  type ApiAdminTransaction,
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

const AdminTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<ApiAdminTransaction[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

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
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:w-48"
          >
            <option value="all">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
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
                        <p className="mt-1 text-xs text-slate-400">{transaction.reference}</p>
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
    </AdminLayout>
  );
};

export default AdminTransactions;