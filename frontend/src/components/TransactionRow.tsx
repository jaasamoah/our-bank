import React from 'react';
import { formatCurrency, formatDate } from '../mock/data';
import type { MockTransaction } from '../mock/data';

const statusStyles: Record<MockTransaction['status'], string> = {
  Completed: 'bg-emerald-50 text-emerald-600',
  Pending: 'bg-amber-50 text-amber-600',
  Failed: 'bg-red-50 text-red-600',
};

const TransactionRow: React.FC<{ txn: MockTransaction; accountName?: string }> = ({ txn, accountName }) => {
  const isCredit = txn.amount > 0;
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3.5 last:border-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-lg">
          {txn.icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{txn.merchant}</p>
          <p className="truncate text-xs text-slate-500">
            {txn.category} {accountName ? `· ${accountName}` : ''} · {formatDate(txn.date)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={`text-sm font-semibold ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}>
          {isCredit ? '+' : ''}
          {formatCurrency(txn.amount)}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyles[txn.status]}`}>
          {txn.status}
        </span>
      </div>
    </div>
  );
};

export default TransactionRow;
