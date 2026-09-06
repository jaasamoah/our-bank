import React, { useEffect } from 'react';
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '../mock/data';
import type { MockTransaction } from '../mock/data';

type TransactionDetailsModalProps = {
  txn: MockTransaction;
  accountName?: string;
  onClose: () => void;
};

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  txn,
  accountName,
  onClose,
}) => {
  const isCredit = (txn.type ?? (txn.amount >= 0 ? 'Credit' : 'Debit')) === 'Credit';
  const ArrowIcon = isCredit ? ArrowDownLeftIcon : ArrowUpRightIcon;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-details-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-full ${
                isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}
            >
              <ArrowIcon className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${isCredit ? 'text-emerald-600' : 'text-red-600'}`}>
                {isCredit ? 'Credit' : 'Debit'}
              </p>
              <h2 id="transaction-details-title" className="text-lg font-bold text-slate-900">
                Transaction details
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close transaction details"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-center">
          <p className={`text-3xl font-bold ${isCredit ? 'text-emerald-600' : 'text-red-600'}`}>
            {isCredit ? '+' : '-'}{formatCurrency(Math.abs(txn.amount))}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">{txn.merchant}</p>
          <span className="mt-2 inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
            {txn.status}
          </span>
        </div>

        <dl className="mt-5 divide-y divide-slate-100 text-sm">
          <div className="flex items-start justify-between gap-4 py-3">
            <dt className="text-slate-500">Description</dt>
            <dd className="max-w-[65%] text-right font-medium text-slate-900">{txn.merchant}</dd>
          </div>
          <div className="flex items-start justify-between gap-4 py-3">
            <dt className="text-slate-500">Category</dt>
            <dd className="text-right font-medium text-slate-900">{txn.category}</dd>
          </div>
          {accountName && (
            <div className="flex items-start justify-between gap-4 py-3">
              <dt className="text-slate-500">Account</dt>
              <dd className="text-right font-medium text-slate-900">{accountName}</dd>
            </div>
          )}
          <div className="flex items-start justify-between gap-4 py-3">
            <dt className="text-slate-500">Date</dt>
            <dd className="text-right font-medium text-slate-900">{formatDate(txn.date)}</dd>
          </div>
          <div className="flex items-start justify-between gap-4 py-3">
            <dt className="text-slate-500">Transaction type</dt>
            <dd className="text-right font-medium capitalize text-slate-900">
              {txn.transactionType ?? 'Account activity'}
            </dd>
          </div>
          {txn.reference && (
            <div className="flex items-start justify-between gap-4 py-3">
              <dt className="text-slate-500">Reference</dt>
              <dd className="max-w-[65%] break-all text-right font-mono text-xs text-slate-700">{txn.reference}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;