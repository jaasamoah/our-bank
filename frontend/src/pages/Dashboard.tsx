import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import TransactionRow from '../components/TransactionRow';
import TransactionDetailsModal from '../components/TransactionDetailsModal';
import { StatementDownloadModal } from '../components/StatementDownloadModal';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../mock/data';
import { getAccounts, getInvestmentPortfolio, getTransactions } from '../services/api';
import { mapAccount, mapTransaction } from '../services/adapters';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const CARD_PALETTES = [
  { gradient: 'from-blue-600 to-blue-800', light: 'bg-blue-50 text-blue-700' },
  { gradient: 'from-emerald-600 to-teal-800', light: 'bg-emerald-50 text-emerald-700' },
  { gradient: 'from-indigo-600 to-violet-800', light: 'bg-indigo-50 text-indigo-700' },
  { gradient: 'from-amber-600 to-orange-700', light: 'bg-amber-50 text-amber-700' },
  { gradient: 'from-slate-700 to-slate-900', light: 'bg-slate-100 text-slate-700' },
];

const DEFAULT_BENCHMARK_CATEGORIES = [
  { category: 'Bills & Utilities', color: 'bg-brand-700' },
  { category: 'Food & Dining', color: 'bg-brand-500' },
  { category: 'Shopping', color: 'bg-brand-400' },
  { category: 'Transfer & Fees', color: 'bg-brand-300' },
  { category: 'Entertainment', color: 'bg-brand-200' },
];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<ReturnType<typeof mapAccount>[]>([]);
  const [transactions, setTransactions] = useState<ReturnType<typeof mapTransaction>[]>([]);
  const [investmentValue, setInvestmentValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<ReturnType<typeof mapTransaction> | null>(null);
  const [statementAccount, setStatementAccount] = useState<ReturnType<typeof mapAccount> | null>(null);

  useEffect(() => {
    const loadDashboard = async (showLoading = false) => {
      if (showLoading) setLoading(true);
      try {
        const [accountData, transactionData, portfolio] = await Promise.all([
          getAccounts(),
          getTransactions(),
          getInvestmentPortfolio(),
        ]);
        setAccounts(accountData.map(mapAccount));
        setTransactions(transactionData.map(mapTransaction));
        setInvestmentValue(portfolio.summary.total_value);
        setError('');
      } catch {
        setError('We could not load your dashboard. Please refresh and try again.');
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    void loadDashboard(true);
    const refresh = window.setInterval(() => void loadDashboard(), 10000);
    return () => window.clearInterval(refresh);
  }, []);

  const totalBalance = accounts
    .filter((a) => a.type !== 'Credit')
    .reduce((sum, a) => sum + a.balance, 0);

  const recentTransactions = transactions.slice(0, 6);
  const accountName = (id: string) => accounts.find((account) => account.id === id)?.name;

  const spendingByCategory = useMemo(() => {
    const totals = transactions
      .filter((transaction) => transaction.amount < 0)
      .reduce<Record<string, number>>((result, transaction) => {
        result[transaction.category] = (result[transaction.category] ?? 0) + Math.abs(transaction.amount);
        return result;
      }, {});

    const colors = ['bg-brand-700', 'bg-brand-500', 'bg-brand-400', 'bg-brand-300', 'bg-brand-200'];
    const activeEntries = Object.entries(totals)
      .sort(([, amountA], [, amountB]) => amountB - amountA)
      .slice(0, 5)
      .map(([category, amount], index) => ({ category, amount, color: colors[index] }));

    if (activeEntries.length > 0) return activeEntries;

    // Zero-state baseline: ensures graph always displays smoothly
    return DEFAULT_BENCHMARK_CATEGORIES.map((cat) => ({
      category: cat.category,
      amount: 0,
      color: cat.color,
    }));
  }, [transactions]);

  const maxSpend = Math.max(...spendingByCategory.map((s) => s.amount), 1);
  const isSpendingEmpty = transactions.filter((t) => t.amount < 0).length === 0;

  return (
    <Layout
      title={`Welcome back, ${user?.fullName?.split(' ')[0] ?? 'there'}`}
      subtitle="Here's what's happening with your money today."
    >
      {error && <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {loading && (
        <div className="rounded-2xl bg-white p-8 shadow-card">
          <LoadingSpinner label="Loading your dashboard" />
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Balance Overview Card */}
            <div className="rounded-2xl bg-white p-6 shadow-card lg:col-span-1">
              <p className="text-sm font-medium text-slate-500">Total balance</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(totalBalance)}</p>
              <p className="mt-1 text-sm text-emerald-600">▲ 3.2% from last month</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  onClick={() => navigate('/transfer')}
                  className="flex-1 rounded-xl bg-brand-700 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-800"
                >
                  Transfer
                </button>
                <button
                  onClick={() => navigate('/accounts')}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  View accounts
                </button>
                <button
                  onClick={() => setStatementAccount(accounts[0] || null)}
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  title="Download Statement"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 text-slate-500" />
                  Statement
                </button>
              </div>
            </div>

            {/* Persistent Spending Graph */}
            <div className="rounded-2xl bg-white p-6 shadow-card lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Spending by category</p>
                  <p className="text-xs text-slate-400">
                    {isSpendingEmpty ? 'No expenses recorded this month' : 'This month summary'}
                  </p>
                </div>
                <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                  Analytics
                </span>
              </div>

              <div className="space-y-3.5">
                {spendingByCategory.map((item) => (
                  <div key={item.category}>
                    <div className="mb-1 flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-700">{item.category}</span>
                      <span className="text-slate-500">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: `${item.amount > 0 ? (item.amount / maxSpend) * 100 : 2}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dynamic Palette Account Cards */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account, index) => {
              const palette = CARD_PALETTES[index % CARD_PALETTES.length];
              return (
                <div
                  key={account.id}
                  onClick={() => navigate(`/accounts/${account.id}`)}
                  className={`group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br ${palette.gradient} p-6 text-white shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                      {account.type}
                    </span>
                    <span className="font-mono text-xs text-white/80">
                      •••• {account.accountNumber.slice(-4)}
                    </span>
                  </div>
                  <p className="mt-2 text-base font-semibold text-white">{account.name}</p>
                  <div className="mt-6">
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(account.balance, account.currency)}
                    </p>
                    <p className="mt-1 text-xs text-white/70">Available balance · Click to view details →</p>
                  </div>
                  <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-xl" />
                </div>
              );
            })}
          </div>

          {/* Investment Snapshot */}
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-brand-100 bg-brand-50 p-5">
            <div>
              <p className="text-sm font-semibold text-brand-900">Investment portfolio</p>
              <p className="mt-1 text-sm text-brand-700">Current value {formatCurrency(investmentValue)}</p>
            </div>
            <button
              onClick={() => navigate('/investments')}
              className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
            >
              View investments
            </button>
          </div>

          {/* Recent Transactions */}
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
            {recentTransactions.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No transactions recorded yet.</p>
            ) : (
              <div>
                {recentTransactions.map((txn) => (
                  <TransactionRow
                    key={txn.id}
                    txn={txn}
                    accountName={accountName(txn.accountId)}
                    onClick={() => setSelectedTransaction(txn)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {selectedTransaction && (
        <TransactionDetailsModal
          txn={selectedTransaction}
          accountName={accountName(selectedTransaction.accountId)}
          onClose={() => setSelectedTransaction(null)}
        />
      )}

      {statementAccount && (
        <StatementDownloadModal
          account={{
            id: statementAccount.id,
            name: statementAccount.name,
            accountNumber: statementAccount.accountNumber,
            type: statementAccount.type,
            currency: statementAccount.currency,
            balance: statementAccount.balance,
          }}
          customer={{
            fullName: user?.fullName,
            email: user?.email,
            address: user?.address,
          }}
          onClose={() => setStatementAccount(null)}
        />
      )}
    </Layout>
  );
};

export default Dashboard;