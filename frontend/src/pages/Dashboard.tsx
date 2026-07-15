import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import AccountCard from '../components/AccountCard';
import TransactionRow from '../components/TransactionRow';
import { useAuth } from '../context/AuthContext';
import {
  mockAccounts,
  mockTransactions,
  spendingByCategory,
  formatCurrency,
} from '../mock/data';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const totalBalance = mockAccounts
    .filter((a) => a.type !== 'Credit')
    .reduce((sum, a) => sum + a.balance, 0);

  const recentTransactions = mockTransactions.slice(0, 6);
  const maxSpend = Math.max(...spendingByCategory.map((s) => s.amount));

  return (
    <Layout title={`Welcome back, ${user?.fullName.split(' ')[0]}`} subtitle="Here's what's happening with your money today.">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-card lg:col-span-1">
          <p className="text-sm font-medium text-slate-500">Total balance</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(totalBalance)}</p>
          <p className="mt-1 text-sm text-emerald-600">▲ 3.2% from last month</p>
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => navigate('/transfer')}
              className="flex-1 rounded-xl bg-brand-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
            >
              Transfer
            </button>
            <button
              onClick={() => navigate('/accounts')}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              View accounts
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Spending by category</p>
            <span className="text-xs text-slate-400">This month</span>
          </div>
          <div className="space-y-3">
            {spendingByCategory.map((item) => (
              <div key={item.category}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{item.category}</span>
                  <span className="text-slate-500">{formatCurrency(item.amount)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${(item.amount / maxSpend) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockAccounts.map((account) => (
          <AccountCard key={account.id} account={account} onClick={() => navigate('/accounts')} />
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-card">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Recent transactions</h2>
          <button
            onClick={() => navigate('/transactions')}
            className="text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            View all
          </button>
        </div>
        <div>
          {recentTransactions.map((txn) => (
            <TransactionRow key={txn.id} txn={txn} />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
