import React, { useEffect, useState } from 'react';
import { ArrowTopRightOnSquareIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import AccountCard from '../components/AccountCard';
import TransactionRow from '../components/TransactionRow';
import TransactionDetailsModal from '../components/TransactionDetailsModal';
import { formatCurrency } from '../mock/data';
import { getAccounts, getInvestmentPortfolio, getTransactions } from '../services/api';
import { mapAccount, mapTransaction } from '../services/adapters';
import LoadingSpinner from '../components/LoadingSpinner';

const Accounts = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<ReturnType<typeof mapAccount>[]>([]);
  const [transactions, setTransactions] = useState<ReturnType<typeof mapTransaction>[]>([]);
  const [portfolio, setPortfolio] = useState<Awaited<ReturnType<typeof getInvestmentPortfolio>> | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<ReturnType<typeof mapTransaction> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getAccounts(), getTransactions(), getInvestmentPortfolio()])
      .then(([accountData, transactionData, portfolioData]) => {
        const mappedAccounts = accountData.map(mapAccount);
        setAccounts(mappedAccounts);
        setTransactions(transactionData.map(mapTransaction));
        setPortfolio(portfolioData);
        setSelectedId((current) => current || mappedAccounts[0]?.id || '');
      })
      .catch(() => setError('We could not load your accounts. Please refresh and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const selectedAccount = accounts.find((account) => account.id === selectedId);
  const accountTransactions = transactions.filter((transaction) => transaction.accountId === selectedId);
  const totalAssets = accounts.filter((account) => account.balance > 0).reduce((sum, account) => sum + account.balance, 0);

  return (
    <Layout title="Accounts" subtitle="Manage your checking, savings, and credit accounts.">
      <div className="mb-6 flex items-center gap-1 rounded-2xl bg-white p-1 shadow-card sm:w-fit">
        <button className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white">Bank accounts</button>
        <button
          onClick={() => navigate('/investments')}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <PresentationChartLineIcon className="h-4 w-4" aria-hidden="true" />
          Investments
        </button>
      </div>

      {loading && <div className="rounded-2xl bg-white p-8 shadow-card"><LoadingSpinner label="Loading your accounts" /></div>}
      {error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!loading && !error && (
        <>
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-card">
        <p className="text-sm font-medium text-slate-500">Total assets across accounts</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(totalAssets)}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
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

      {portfolio && (
        <button
          onClick={() => navigate('/investments')}
          className="mt-6 flex w-full items-center justify-between rounded-2xl bg-slate-900 p-6 text-left text-white shadow-card transition-transform hover:-translate-y-0.5"
        >
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <PresentationChartLineIcon className="h-5 w-5 text-brand-300" aria-hidden="true" />
              Investment portfolio
            </div>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(portfolio.summary.total_value)}</p>
            <p className="mt-1 text-sm text-emerald-300">
              +{formatCurrency(portfolio.summary.total_gain)} total return · {portfolio.summary.gain_percentage.toFixed(2)}%
            </p>
          </div>
          <ArrowTopRightOnSquareIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
        </button>
      )}

      {selectedAccount && <div className="mt-6 rounded-2xl bg-white p-6 shadow-card">
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
              <TransactionRow
                key={txn.id}
                txn={txn}
                accountName={selectedAccount.name}
                onClick={() => setSelectedTransaction(txn)}
              />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">No transactions for this account yet.</p>
        )}
      </div>
      }
        </>
      )}
      {selectedTransaction && (
        <TransactionDetailsModal
          txn={selectedTransaction}
          accountName={selectedAccount?.name}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </Layout>
  );
};

export default Accounts;
