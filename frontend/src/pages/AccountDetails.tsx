import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ArrowDownTrayIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import TransactionRow from '../components/TransactionRow';
import TransactionDetailsModal from '../components/TransactionDetailsModal';
import { StatementDownloadModal } from '../components/StatementDownloadModal';
import { getAccounts, getTransactions } from '../services/api';
import { mapAccount, mapTransaction } from '../services/adapters';
import { formatCurrency } from '../mock/data';
import { useAuth } from '../context/AuthContext';

const CARD_PALETTES = [
  'from-blue-600 to-blue-800',
  'from-emerald-600 to-teal-800',
  'from-indigo-600 to-violet-800',
  'from-amber-600 to-orange-700',
  'from-slate-700 to-slate-900',
];

const AccountDetails: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [account, setAccount] = useState<ReturnType<typeof mapAccount> | null>(null);
  const [accountIndex, setAccountIndex] = useState(0);
  const [transactions, setTransactions] = useState<ReturnType<typeof mapTransaction>[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState<ReturnType<typeof mapTransaction> | null>(null);
  const [showStatementModal, setShowStatementModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const [accList, txnList] = await Promise.all([
          getAccounts(),
          getTransactions({ account_id: accountId }),
        ]);

        if (!isMounted) return;

        const idx = accList.findIndex((a) => String(a.id) === accountId);
        if (idx === -1) {
          navigate('/accounts', { replace: true });
          return;
        }

        setAccountIndex(idx);
        setAccount(mapAccount(accList[idx]));
        setTransactions(txnList.map(mapTransaction));
      } catch {
        navigate('/accounts', { replace: true });
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadData();
    return () => {
      isMounted = false;
    };
  }, [accountId, navigate]);

  if (loading || !account) {
    return (
      <Layout title="Account Details" subtitle="Loading account information...">
        <div className="flex h-64 items-center justify-center rounded-2xl bg-white shadow-card">
          <LoadingSpinner label="Loading account details" />
        </div>
      </Layout>
    );
  }

  const gradient = CARD_PALETTES[accountIndex % CARD_PALETTES.length];

  return (
    <Layout title={account.name} subtitle={`Details and transaction activity for •••• ${account.accountNumber.slice(-4)}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/accounts')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Back to accounts
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setShowStatementModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4 text-slate-500" /> Download Statement
            </button>
            <button
              onClick={() => navigate('/transfer')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-800"
            >
              <ArrowUpRightIcon className="h-4 w-4" /> Transfer
            </button>
          </div>
        </div>

        {/* Account Banner Card */}
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${gradient} p-8 text-white shadow-lg`}>
          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium tracking-wide uppercase">
                {account.type} Account
              </span>
              <p className="mt-3 font-mono text-sm tracking-widest text-white/80">
                •••• •••• •••• {account.accountNumber.slice(-4)}
              </p>
              <p className="mt-2 text-xs text-white/70">Full Account Number: <span className="font-mono font-medium text-white">{account.accountNumber}</span></p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-xs font-medium text-white/75">Available Balance</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">
                {formatCurrency(account.balance, account.currency)}
              </p>
              <p className="mt-1 text-xs text-white/70">Status: <span className="font-semibold text-white">{account.status}</span></p>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        </div>

        {/* Account History Section */}
        <div className="rounded-2xl bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Account History</h3>
            <span className="text-xs text-slate-400">{transactions.length} record{transactions.length === 1 ? '' : 's'}</span>
          </div>

          {transactions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <p className="text-sm font-medium text-slate-600">No transactions recorded yet</p>
              <p className="mt-1 text-xs text-slate-400">Activity on this account will appear here immediately.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map((txn) => (
                <TransactionRow
                  key={txn.id}
                  txn={txn}
                  accountName={account.name}
                  onClick={() => setSelectedTxn(txn)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedTxn && (
        <TransactionDetailsModal
          txn={selectedTxn}
          accountName={account.name}
          onClose={() => setSelectedTxn(null)}
        />
      )}

      {showStatementModal && (
        <StatementDownloadModal
          account={{
            id: account.id,
            name: account.name,
            accountNumber: account.accountNumber,
            type: account.type,
            currency: account.currency,
            balance: account.balance,
          }}
          customer={{
            fullName: user?.fullName,
            email: user?.email,
            address: user?.address,
          }}
          onClose={() => setShowStatementModal(false)}
        />
      )}
    </Layout>
  );
};

export default AccountDetails;