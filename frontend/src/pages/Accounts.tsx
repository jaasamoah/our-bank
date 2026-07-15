import React, { useState } from 'react';
import Layout from '../components/Layout';
import AccountCard from '../components/AccountCard';
import TransactionRow from '../components/TransactionRow';
import { mockAccounts, mockTransactions, formatCurrency } from '../mock/data';

const Accounts = () => {
  const [selectedId, setSelectedId] = useState(mockAccounts[0].id);
  const selectedAccount = mockAccounts.find((a) => a.id === selectedId)!;
  const accountTransactions = mockTransactions.filter((t) => t.accountId === selectedId);

  const totalAssets = mockAccounts.filter((a) => a.balance > 0).reduce((sum, a) => sum + a.balance, 0);

  return (
    <Layout title="Accounts" subtitle="Manage your checking, savings, and credit accounts.">
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-card">
        <p className="text-sm font-medium text-slate-500">Total assets across accounts</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(totalAssets)}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockAccounts.map((account) => (
          <div key={account.id} className="relative">
            <AccountCard account={account} onClick={() => setSelectedId(account.id)} />
            {selectedId === account.id && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-3 py-0.5 text-[11px] font-medium text-white shadow">
                Selected
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{selectedAccount.name}</h2>
            <p className="text-sm text-slate-500">Account number {selectedAccount.number}</p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Download statement
            </button>
            <button className="rounded-lg bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-800">
              Account details
            </button>
          </div>
        </div>

        {accountTransactions.length > 0 ? (
          <div>
            {accountTransactions.map((txn) => (
              <TransactionRow key={txn.id} txn={txn} />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">No transactions for this account yet.</p>
        )}
      </div>
    </Layout>
  );
};

export default Accounts;
