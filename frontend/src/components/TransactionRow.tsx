import React from 'react';
import { ArrowDownLeftIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '../mock/data';
import type { MockTransaction } from '../mock/data';

const statusStyles: Record<MockTransaction['status'], string> = {
  Completed: 'bg-emerald-50 text-emerald-600',
  Processing: 'bg-amber-50 text-amber-600',
  Pending: 'bg-amber-50 text-amber-600',
  Failed: 'bg-red-50 text-red-600',
  Reversed: 'bg-slate-100 text-slate-600',
};

const TransactionRow: React.FC<{
  txn: MockTransaction;
  accountName?: string;
  onClick?: () => void;
}> = ({ txn, accountName, onClick }) => {
  const isCredit = txn.type === 'Credit' || (txn.type === undefined && txn.amount >= 0);
  const ArrowIcon = isCredit ? ArrowDownLeftIcon : ArrowUpRightIcon;
  const row = (
    <>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
        }`}
      >
        <ArrowIcon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{txn.merchant}</p>
        <p className="truncate text-xs text-slate-500">
          {isCredit ? 'Credit' : 'Debit'} · {txn.category} {accountName ? `· ${accountName}` : ''} · {formatDate(txn.date)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={`text-sm font-semibold ${isCredit ? 'text-emerald-600' : 'text-red-600'}`}>
          {isCredit ? '+' : '-'}
          {formatCurrency(Math.abs(txn.amount))}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyles[txn.status]}`}>
          {txn.status}
        </span>
      </div>
    </>
  );

  if (!onClick) {
    return <div className="flex items-center gap-3 border-b border-slate-100 py-3.5 last:border-0">{row}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-slate-100 py-3.5 text-left transition-colors last:border-0 hover:bg-slate-50"
      aria-label={`View details for ${txn.merchant}`}
    >
      {row}
    </button>
  );
};

export default TransactionRow;
