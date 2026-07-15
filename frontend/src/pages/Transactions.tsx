import React, { useMemo, useState } from 'react';
import Layout from '../components/Layout';
import TransactionRow from '../components/TransactionRow';
import { mockAccounts, mockTransactions } from '../mock/data';

const Transactions = () => {
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return mockTransactions
      .filter((t) => (accountFilter === 'all' ? true : t.accountId === accountFilter))
      .filter((t) => t.merchant.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [accountFilter, search]);

  const accountName = (id: string) => mockAccounts.find((a) => a.id === id)?.name;

  return (
    <Layout title="Transactions" subtitle="Every transaction across your accounts, in one place.">
      <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search merchant or category"
          className="w-full flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:w-56"
        >
          <option value="all">All accounts</option>
          {mockAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-card">
        {filtered.length > 0 ? (
          filtered.map((txn) => (
            <TransactionRow key={txn.id} txn={txn} accountName={accountName(txn.accountId)} />
          ))
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">No transactions match your search.</p>
        )}
      </div>
    </Layout>
  );
};

export default Transactions;
